---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan gateway jarak jauh
summary: Akses jarak jauh menggunakan tunnel SSH (Gateway WS) dan tailnet
title: Akses Jarak Jauh
x-i18n:
    generated_at: "2026-04-05T13:54:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Akses jarak jauh (SSH, tunnel, dan tailnet)

Repo ini mendukung “remote over SSH” dengan mempertahankan satu Gateway (master) yang berjalan pada host khusus (desktop/server) dan menghubungkan klien ke sana.

- Untuk **operator (Anda / aplikasi macOS)**: tunneling SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat masa depan)**: hubungkan ke Gateway **WebSocket** (LAN/tailnet atau tunnel SSH sesuai kebutuhan).

## Gagasan inti

- Gateway WebSocket melakukan bind ke **loopback** pada port yang Anda konfigurasikan (default 18789).
- Untuk penggunaan jarak jauh, Anda meneruskan port loopback itu melalui SSH (atau menggunakan tailnet/VPN dan mengurangi kebutuhan tunnel).

## Penyiapan VPN/tailnet umum (tempat agen berada)

Anggap **host Gateway** sebagai “tempat agen berada.” Host itu memiliki sesi, profil autentikasi, channel, dan state.
Laptop/desktop Anda (dan node) terhubung ke host tersebut.

### 1) Gateway yang selalu aktif di tailnet Anda (VPS atau server rumahan)

Jalankan Gateway pada host persisten dan akses melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk UI Kontrol.
- **Fallback:** pertahankan loopback + tunnel SSH dari mesin mana pun yang memerlukan akses.
- **Contoh:** [exe.dev](/install/exe-dev) (VM mudah) atau [Hetzner](/install/hetzner) (VPS produksi).

Ini ideal saat laptop Anda sering tidur tetapi Anda ingin agen selalu aktif.

### 2) Desktop rumah menjalankan Gateway, laptop menjadi kendali jarak jauh

Laptop **tidak** menjalankan agen. Laptop terhubung dari jarak jauh:

- Gunakan mode **Remote over SSH** pada aplikasi macOS (Settings → General → “OpenClaw runs”).
- Aplikasi membuka dan mengelola tunnel, sehingga WebChat + pemeriksaan kesehatan “langsung berfungsi.”

Panduan: [akses jarak jauh macOS](/platforms/mac/remote).

### 3) Laptop menjalankan Gateway, akses jarak jauh dari mesin lain

Pertahankan Gateway tetap lokal tetapi ekspos dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Sajikan UI Kontrol dengan Tailscale Serve dan pertahankan Gateway hanya-loopback.

Panduan: [Tailscale](/gateway/tailscale) dan [ikhtisar Web](/web).

## Alur perintah (apa yang berjalan di mana)

Satu layanan gateway memiliki state + channel. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agen** dan memutuskan apakah perlu memanggil tool node.
- Gateway memanggil **node** melalui Gateway WebSocket (`node.*` RPC).
- Node mengembalikan hasil; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang seharusnya berjalan per host kecuali Anda dengan sengaja menjalankan profil terisolasi (lihat [Multiple gateways](/gateway/multiple-gateways)).
- “Node mode” pada aplikasi macOS hanyalah klien node melalui Gateway WebSocket.

## Tunnel SSH (CLI + tools)

Buat tunnel lokal ke WS Gateway jarak jauh:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Dengan tunnel aktif:

- `openclaw health` dan `openclaw status --deep` sekarang menjangkau gateway jarak jauh melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url` bila diperlukan.

Catatan: ganti `18789` dengan `gateway.port` yang Anda konfigurasikan (atau `--port`/`OPENCLAW_GATEWAY_PORT`).
Catatan: saat Anda memberikan `--url`, CLI tidak akan fallback ke konfigurasi atau kredensial environment.
Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah kesalahan.

## Default jarak jauh CLI

Anda dapat menyimpan target jarak jauh agar perintah CLI menggunakannya secara default:

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

Saat gateway hanya-loopback, pertahankan URL di `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama di jalur call/probe/status dan pemantauan persetujuan-eksekusi Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (secara sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau tool `gatewayToken`) selalu menang pada jalur call yang menerima autentikasi eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan ulang kredensial implisit config/env.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) hanya dapat menggunakan kredensial env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback jarak jauh hanya berlaku ketika input token autentikasi lokal tidak disetel)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback jarak jauh hanya berlaku ketika input password autentikasi lokal tidak disetel)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh bersifat ketat secara default: menggunakan `gateway.remote.token` saja (tanpa fallback token lokal) saat menargetkan mode jarak jauh.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## UI Chat melalui SSH

WebChat tidak lagi menggunakan port HTTP terpisah. UI chat SwiftUI terhubung langsung ke Gateway WebSocket.

- Teruskan `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Di macOS, sebaiknya gunakan mode “Remote over SSH” pada aplikasi, yang mengelola tunnel secara otomatis.

## Aplikasi macOS "Remote over SSH"

Aplikasi bilah menu macOS dapat mengelola penyiapan yang sama secara menyeluruh (pemeriksaan status jarak jauh, WebChat, dan penerusan Voice Wake).

Panduan: [akses jarak jauh macOS](/platforms/mac/remote).

## Aturan keamanan (jarak jauh/VPN)

Versi singkat: **pertahankan Gateway hanya-loopback** kecuali Anda yakin memerlukan bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa eksposur publik).
- `ws://` plaintext secara default hanya loopback. Untuk jaringan privat tepercaya,
  setel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai break-glass.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` saat loopback tidak tersedia) harus menggunakan autentikasi gateway: token, password, atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Keduanya **tidak** mengonfigurasi autentikasi server dengan sendirinya.
- Jalur call lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak disetel.
- Jika `gateway.auth.token` / `gateway.auth.password` secara eksplisit dikonfigurasi melalui SecretRef dan belum di-resolve, resolusi gagal tertutup (tidak ada fallback jarak jauh yang menutupi).
- `gateway.remote.tlsFingerprint` melakukan pin pada sertifikat TLS jarak jauh saat menggunakan `wss://`.
- **Tailscale Serve** dapat mengautentikasi lalu lintas UI Kontrol/WebSocket melalui header identitas saat `gateway.auth.allowTailscale: true`; endpoint API HTTP tidak menggunakan autentikasi header Tailscale tersebut dan sebagai gantinya mengikuti mode autentikasi HTTP normal gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Setel ke `false` jika Anda ingin autentikasi shared-secret di semua tempat.
- Autentikasi **trusted-proxy** hanya untuk penyiapan proxy sadar identitas non-loopback.
  Reverse proxy loopback pada host yang sama tidak memenuhi `gateway.auth.mode: "trusted-proxy"`.
- Perlakukan kontrol browser seperti akses operator: tailnet-only + pairing node yang disengaja.

Pendalaman: [Security](/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway jarak jauh, penyiapan persisten termudah menggunakan entri konfigurasi SSH `LocalForward` ditambah LaunchAgent agar tunnel tetap aktif lintas reboot dan crash.

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

#### Langkah 3: konfigurasikan token gateway

Simpan token dalam konfigurasi agar tetap ada setelah restart:

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

Tunnel akan dimulai secara otomatis saat login, dimulai ulang saat crash, dan menjaga port yang diteruskan tetap aktif.

Catatan: jika Anda memiliki LaunchAgent `com.openclaw.ssh-tunnel` yang tersisa dari penyiapan lama, unload dan hapus.

#### Pemecahan masalah

Periksa apakah tunnel sedang berjalan:

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

| Entri konfigurasi                     | Fungsinya                                                    |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Meneruskan port lokal 18789 ke port jarak jauh 18789         |
| `ssh -N`                             | SSH tanpa mengeksekusi perintah jarak jauh (hanya port-forwarding) |
| `KeepAlive`                          | Secara otomatis memulai ulang tunnel jika crash              |
| `RunAtLoad`                          | Memulai tunnel saat LaunchAgent dimuat ketika login          |
