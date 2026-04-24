---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan gateway remote
summary: Akses jarak jauh menggunakan tunnel SSH (Gateway WS) dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-04-24T09:09:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Akses jarak jauh (SSH, tunnel, dan tailnet)

Repo ini mendukung “remote over SSH” dengan menjaga satu Gateway (master) tetap berjalan di host khusus (desktop/server) dan menghubungkan klien ke host tersebut.

- Untuk **operator (Anda / aplikasi macOS)**: tunneling SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat mendatang)**: sambungkan ke **WebSocket** Gateway (LAN/tailnet atau tunnel SSH bila diperlukan).

## Ide intinya

- WebSocket Gateway bind ke **loopback** pada port yang dikonfigurasi (default `18789`).
- Untuk penggunaan remote, Anda meneruskan port loopback itu melalui SSH (atau menggunakan tailnet/VPN dan mengurangi kebutuhan tunnel).

## Penyiapan VPN/tailnet umum (tempat agen berada)

Anggap **host Gateway** sebagai “tempat agen berada.” Host ini memiliki sesi, profil autentikasi, kanal, dan status.
Laptop/desktop Anda (dan node) terhubung ke host tersebut.

### 1) Gateway selalu aktif di tailnet Anda (VPS atau server rumahan)

Jalankan Gateway di host persisten dan akses melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk Control UI.
- **Fallback:** pertahankan loopback + tunnel SSH dari mesin mana pun yang memerlukan akses.
- **Contoh:** [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi).

Ini ideal saat laptop Anda sering sleep tetapi Anda ingin agen selalu aktif.

### 2) Desktop rumah menjalankan Gateway, laptop menjadi remote control

Laptop **tidak** menjalankan agen. Laptop terhubung dari jarak jauh:

- Gunakan mode **Remote over SSH** pada aplikasi macOS (Settings → General → “OpenClaw runs”).
- Aplikasi membuka dan mengelola tunnel, sehingga WebChat + pemeriksaan kesehatan “langsung berfungsi.”

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

### 3) Laptop menjalankan Gateway, akses jarak jauh dari mesin lain

Biarkan Gateway tetap lokal tetapi tampilkan dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Gunakan Tailscale Serve untuk Control UI dan pertahankan Gateway hanya-loopback.

Panduan: [Tailscale](/id/gateway/tailscale) dan [Ikhtisar Web](/id/web).

## Alur perintah (apa yang berjalan di mana)

Satu layanan gateway memiliki status + kanal. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agen** dan memutuskan apakah perlu memanggil tool node.
- Gateway memanggil **node** melalui WebSocket Gateway (`node.*` RPC).
- Node mengembalikan hasil; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang sebaiknya berjalan per host kecuali Anda memang sengaja menjalankan profile terisolasi (lihat [Multiple gateways](/id/gateway/multiple-gateways)).
- “Mode node” aplikasi macOS hanyalah klien node melalui WebSocket Gateway.

## Tunnel SSH (CLI + tools)

Buat tunnel lokal ke Gateway WS remote:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Saat tunnel aktif:

- `openclaw health` dan `openclaw status --deep` kini menjangkau gateway remote melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url` bila diperlukan.

Catatan: ganti `18789` dengan `gateway.port` yang Anda konfigurasi (atau `--port`/`OPENCLAW_GATEWAY_PORT`).
Catatan: saat Anda memberikan `--url`, CLI tidak fallback ke kredensial konfigurasi atau lingkungan.
Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.

## Default remote CLI

Anda dapat mempertahankan target remote agar perintah CLI menggunakannya secara default:

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

Saat gateway hanya-loopback, biarkan URL di `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama di seluruh jalur call/probe/status dan pemantauan persetujuan exec Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (dengan sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau tool `gatewayToken`) selalu menang pada jalur panggilan yang menerima autentikasi eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan ulang kredensial implisit config/env.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) hanya boleh menggunakan kredensial env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback remote hanya berlaku saat input token auth lokal tidak diatur)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback remote hanya berlaku saat input password auth lokal tidak diatur)
- Default mode remote:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status remote bersifat ketat secara default: pemeriksaan ini hanya menggunakan `gateway.remote.token` (tanpa fallback token lokal) saat menargetkan mode remote.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## UI obrolan melalui SSH

WebChat tidak lagi menggunakan port HTTP terpisah. UI obrolan SwiftUI terhubung langsung ke WebSocket Gateway.

- Forward `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Di macOS, utamakan mode “Remote over SSH” pada aplikasi, yang mengelola tunnel secara otomatis.

## Aplikasi macOS "Remote over SSH"

Aplikasi menu bar macOS dapat menjalankan penyiapan yang sama secara end-to-end (pemeriksaan status remote, WebChat, dan penerusan Voice Wake).

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (remote/VPN)

Versi singkat: **pertahankan Gateway hanya-loopback** kecuali Anda yakin memerlukan bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa eksposur publik).
- `ws://` plaintext secara default hanya untuk loopback. Untuk jaringan private tepercaya,
  setel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai
  pemecah kaca darurat. Tidak ada padanan `openclaw.json`; ini harus berupa
  lingkungan proses untuk klien yang membuat koneksi WebSocket.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` saat loopback tidak tersedia) harus menggunakan autentikasi gateway: token, password, atau reverse proxy yang sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Nilai-nilai ini **tidak** mengonfigurasi autentikasi server dengan sendirinya.
- Jalur panggilan lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak diatur.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tanpa masking fallback remote).
- `gateway.remote.tlsFingerprint` melakukan pin terhadap sertifikat TLS remote saat menggunakan `wss://`.
- **Tailscale Serve** dapat mengautentikasi lalu lintas Control UI/WebSocket melalui header identitas
  saat `gateway.auth.allowTailscale: true`; endpoint HTTP API tidak
  menggunakan autentikasi header Tailscale tersebut dan sebagai gantinya mengikuti mode
  autentikasi HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Setel ke
  `false` jika Anda ingin autentikasi shared-secret di semua tempat.
- Autentikasi **Trusted-proxy** hanya untuk penyiapan proxy sadar identitas non-loopback.
  Reverse proxy loopback di host yang sama tidak memenuhi `gateway.auth.mode: "trusted-proxy"`.
- Perlakukan kontrol browser seperti akses operator: hanya-tailnet + pairing node yang disengaja.

Pembahasan mendalam: [Security](/id/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway remote, penyiapan persisten termudah menggunakan entri konfigurasi SSH `LocalForward` plus LaunchAgent agar tunnel tetap hidup di antara reboot dan crash.

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

#### Langkah 2: salin key SSH (sekali saja)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Langkah 3: konfigurasikan token gateway

Simpan token di konfigurasi agar tetap ada setelah restart:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Langkah 4: buat LaunchAgent

Simpan ini sebagai `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Tunnel akan dimulai secara otomatis saat login, restart saat crash, dan menjaga port yang diteruskan tetap aktif.

Catatan: jika Anda memiliki LaunchAgent `com.openclaw.ssh-tunnel` yang tersisa dari penyiapan lama, unload dan hapus terlebih dahulu.

#### Pemecahan masalah

Periksa apakah tunnel berjalan:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Mulai ulang tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Hentikan tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entri konfigurasi                      | Fungsinya                                                    |
| -------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`   | Meneruskan port lokal 18789 ke port remote 18789             |
| `ssh -N`                               | SSH tanpa menjalankan perintah remote (hanya port-forwarding) |
| `KeepAlive`                            | Otomatis memulai ulang tunnel jika crash                     |
| `RunAtLoad`                            | Memulai tunnel saat LaunchAgent dimuat saat login            |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Authentication](/id/gateway/authentication)
- [Remote gateway setup](/id/gateway/remote-gateway-readme)
