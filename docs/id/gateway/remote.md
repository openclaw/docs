---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan Gateway jarak jauh
summary: Akses jarak jauh menggunakan WS Gateway, terowongan SSH, dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-07-12T14:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw menjalankan satu Gateway (utama) pada sebuah host dan menghubungkan setiap klien ke sana. Gateway memiliki sesi, profil autentikasi, kanal, dan status; semua yang lain adalah klien.

- **Operator** (Anda, atau aplikasi macOS): WebSocket LAN/Tailnet langsung adalah pilihan paling sederhana ketika Gateway dapat dijangkau; penerowongan SSH adalah alternatif universal.
- **Node** (iOS/Android dan perangkat lainnya): terhubung ke **WebSocket** Gateway (LAN/tailnet atau terowongan SSH).

## Gagasan inti

WebSocket Gateway terikat ke **loopback** secara default, pada port `18789` (`gateway.port`). Untuk penggunaan jarak jauh, ekspos melalui Tailscale Serve / pengikatan LAN-Tailnet tepercaya, atau teruskan port loopback melalui SSH.

## Opsi topologi

| Penyiapan                                | Tempat Gateway berjalan                                                                                  | Paling sesuai untuk                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway yang selalu aktif di tailnet Anda | Host persisten (VPS atau server rumah), dijangkau melalui Tailscale atau SSH                             | Laptop yang sering tertidur tetapi memerlukan agen selalu aktif. Lihat [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi). |
| Desktop rumah                            | Desktop; laptop terhubung dari jarak jauh melalui mode jarak jauh aplikasi macOS (Settings → Connection → OpenClaw runs) | Menjaga agen tetap berjalan pada perangkat keras yang terus menyala. Panduan operasional: [akses jarak jauh macOS](/id/platforms/mac/remote). |
| Laptop                                   | Laptop, diekspos dengan aman melalui terowongan SSH atau Tailscale Serve (pertahankan `gateway.bind: "loopback"`) | Penyiapan satu mesin. Lihat [Tailscale](/id/gateway/tailscale) dan [Web](/id/web).                                                                          |

Untuk penyiapan yang selalu aktif dan laptop, sebaiknya pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk UI Kontrol, atau pengikatan LAN/Tailnet tepercaya dengan `gateway.remote.transport: "direct"`. Terowongan SSH adalah alternatif yang berfungsi dari mesin mana pun.

## Alur perintah (apa yang berjalan di mana)

Satu Gateway memiliki status dan kanal; node adalah periferal. Contoh (pesan Telegram dirutekan ke alat node):

1. Pesan Telegram tiba di **Gateway**.
2. Gateway menjalankan **agen**, yang memutuskan apakah akan memanggil alat node.
3. Gateway memanggil **node** melalui WebSocket Gateway (RPC `node.invoke`).
4. Node mengembalikan hasil; Gateway membalas ke Telegram.

Node tidak menjalankan layanan Gateway. Hanya satu Gateway yang sebaiknya berjalan per host, kecuali jika Anda sengaja menjalankan profil terisolasi (lihat [Beberapa Gateway](/id/gateway/multiple-gateways)). "Mode node" aplikasi macOS hanyalah klien node melalui WebSocket Gateway.

## Terowongan SSH (CLI + alat)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Saat terowongan aktif, `openclaw health` dan `openclaw status --deep` menjangkau Gateway jarak jauh melalui `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url`.

<Note>
Ganti `18789` dengan `gateway.port` yang Anda konfigurasikan (atau `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` tidak pernah menggunakan kembali kredensial dari konfigurasi atau lingkungan. Berikan `--token` atau `--password` secara eksplisit; tanpanya, klien tidak mengirim kredensial dan koneksi gagal jika Gateway target mewajibkan autentikasi.
</Warning>

## Default jarak jauh CLI

Simpan target jarak jauh agar perintah CLI menggunakannya secara default:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Saat Gateway hanya menggunakan loopback, pertahankan URL sebagai `ws://127.0.0.1:18789` dan buka terowongan SSH terlebih dahulu. Dalam transportasi terowongan SSH aplikasi macOS, nama host Gateway yang ditemukan dimasukkan ke `gateway.remote.sshTarget` (`user@host` atau `user@host:port`); `gateway.remote.url` tetap berupa URL terowongan lokal. Jika port jarak jauh berbeda dari port lokal, atur `gateway.remote.remotePort`.

Verifikasi kunci host bersifat ketat secara default (`gateway.remote.sshHostKeyPolicy: "strict"`). Atur menjadi `"openssh"` untuk mendelegasikannya ke konfigurasi OpenSSH efektif Anda; tinjau pengaturan SSH pengguna dan sistem Anda sebelum mengaktifkannya.

Untuk Gateway yang sudah dapat dijangkau melalui LAN atau Tailnet tepercaya, gunakan mode langsung:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama pada jalur pemanggilan/probe/status dan pemantauan persetujuan eksekusi Discord. Host node menggunakan kontrak yang sama dengan satu pengecualian mode lokal (mengabaikan `gateway.remote.*`).

- Kredensial eksplisit (`--token`, `--password`, atau `gatewayToken` milik alat) selalu diprioritaskan pada jalur pemanggilan yang menerima autentikasi eksplisit.
- Keamanan penggantian URL:
  - `--url` CLI tidak pernah menggunakan kembali kredensial konfigurasi/lingkungan implisit.
  - `OPENCLAW_GATEWAY_URL` dari lingkungan hanya dapat menggunakan kredensial lingkungan (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (alternatif jarak jauh hanya ketika token lokal belum diatur)
  - kata sandi: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (alternatif jarak jauh hanya ketika kata sandi lokal belum diatur)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - kata sandi: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal host node: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh bersifat ketat secara default: pemeriksaan tersebut hanya menggunakan `gateway.remote.token` (tanpa alternatif token lokal) ketika menargetkan mode jarak jauh.
- Penggantian lingkungan Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## Akses jarak jauh UI percakapan

WebChat tidak memiliki port HTTP terpisah; UI percakapan SwiftUI terhubung langsung ke WebSocket Gateway.

- Teruskan `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Untuk mode langsung LAN/Tailnet, hubungkan klien ke URL privat `ws://` atau URL aman `wss://` yang dikonfigurasikan.
- Di macOS, mode jarak jauh aplikasi mengelola transportasi yang dipilih secara otomatis.

## Mode jarak jauh aplikasi macOS

Aplikasi bilah menu macOS menjalankan penyiapan yang sama dari awal hingga akhir: pemeriksaan status jarak jauh, WebChat, dan penerusan Voice Wake. Panduan operasional: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (jarak jauh/VPN)

Pertahankan Gateway **hanya pada loopback**, kecuali Anda yakin memerlukan pengikatan.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa paparan publik).
- `ws://` tanpa enkripsi diterima untuk host loopback, privat/LAN (RFC 1918), link-local, CGNAT, `.local`, dan `.ts.net`. Host publik jarak jauh wajib menggunakan `wss://`.
- **Pengikatan non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` ketika loopback tidak tersedia) wajib menggunakan autentikasi Gateway: token, kata sandi, atau proksi balik yang mengenali identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien; keduanya tidak mengonfigurasi autentikasi server dengan sendirinya.
- Jalur pemanggilan lokal hanya dapat menggunakan `gateway.remote.*` sebagai alternatif ketika `gateway.auth.*` belum diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasikan secara eksplisit melalui SecretRef dan tidak dapat diresolusikan, resolusi gagal secara tertutup (tidak ada alternatif jarak jauh yang menyamarkan kegagalan).
- `gateway.remote.tlsFingerprint` menyematkan sertifikat TLS jarak jauh untuk `wss://`, termasuk mode langsung macOS. Tanpa sematan yang tersimpan, macOS hanya menyematkan pada penggunaan pertama setelah kepercayaan sistem normal berhasil; Gateway dengan sertifikat yang ditandatangani sendiri atau CA privat memerlukan sidik jari eksplisit atau akses Jarak Jauh melalui SSH.
- **Tailscale Serve** dapat mengautentikasi lalu lintas UI Kontrol/WebSocket melalui header identitas ketika `gateway.auth.allowTailscale: true`. Titik akhir API HTTP tidak menggunakan autentikasi header tersebut dan mengikuti mode autentikasi HTTP normal Gateway. Alur tanpa token ini mengasumsikan host Gateway tepercaya; atur menjadi `false` untuk autentikasi rahasia bersama di semua tempat.
- Autentikasi **proksi tepercaya** secara default mengharapkan proksi non-loopback yang mengenali identitas. Proksi balik loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Perlakukan kontrol melalui peramban seperti akses operator: hanya melalui tailnet serta pemasangan node yang disengaja.

Pembahasan mendalam: [Keamanan](/id/gateway/security).

### macOS: terowongan SSH persisten melalui LaunchAgent

Untuk klien macOS, penyiapan persisten termudah menggunakan entri konfigurasi `LocalForward` SSH beserta LaunchAgent yang menjaga terowongan tetap aktif setelah mulai ulang dan kerusakan.

#### Langkah 1: tambahkan konfigurasi SSH

Edit `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ganti `<REMOTE_IP>` dan `<REMOTE_USER>` dengan nilai Anda.

#### Langkah 2: salin kunci SSH (satu kali)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Langkah 3: konfigurasikan token Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Gunakan `gateway.remote.password` sebagai gantinya jika Gateway jarak jauh menggunakan autentikasi kata sandi. `OPENCLAW_GATEWAY_TOKEN` tetap valid sebagai penggantian pada tingkat shell, tetapi penyiapan klien jarak jauh yang persisten adalah `gateway.remote.token` / `gateway.remote.password`.

#### Langkah 4: buat LaunchAgent

Simpan sebagai `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Langkah 5: muat LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Terowongan dimulai secara otomatis saat masuk, dimulai ulang ketika mengalami kerusakan, dan menjaga port yang diteruskan tetap aktif.

<Note>
Jika Anda masih memiliki LaunchAgent `com.openclaw.ssh-tunnel` dari penyiapan lama, bongkar dan hapus LaunchAgent tersebut.
</Note>

#### Pemecahan masalah

```bash
# Periksa apakah terowongan sedang berjalan
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Mulai ulang terowongan
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Hentikan terowongan
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entri konfigurasi                     | Fungsinya                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Meneruskan port lokal 18789 ke port jarak jauh 18789                       |
| `ssh -N`                              | SSH tanpa menjalankan perintah jarak jauh (hanya penerusan port)           |
| `KeepAlive`                           | Memulai ulang terowongan secara otomatis jika mengalami kerusakan          |
| `RunAtLoad`                           | Memulai terowongan ketika LaunchAgent dimuat saat masuk                     |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Autentikasi](/id/gateway/authentication)
- [Penyiapan Gateway jarak jauh](/id/gateway/remote-gateway-readme)
