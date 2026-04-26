---
read_when:
    - Menjalankan atau men-debug penyiapan Gateway jarak jauh
summary: Akses jarak jauh menggunakan tunnel SSH (Gateway WS) dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-04-26T11:29:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Repo ini mendukung “jarak jauh melalui SSH” dengan menjaga satu Gateway (master) tetap berjalan pada host khusus (desktop/server) dan menghubungkan klien ke sana.

- Untuk **operator (Anda / app macOS)**: tunnel SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat masa depan)**: terhubung ke **WebSocket** Gateway (LAN/tailnet atau tunnel SSH sesuai kebutuhan).

## Gagasan inti

- WebSocket Gateway bind ke **loopback** pada port yang Anda konfigurasikan (default ke 18789).
- Untuk penggunaan jarak jauh, Anda meneruskan port loopback tersebut melalui SSH (atau menggunakan tailnet/VPN dan mengurangi kebutuhan tunnel).

## Penyiapan VPN/tailnet umum (tempat agen berada)

Anggap **host Gateway** sebagai “tempat agen berada.” Host ini memiliki sesi, profil auth, saluran, dan status.
Laptop/desktop Anda (dan node) terhubung ke host tersebut.

### 1) Gateway selalu aktif di tailnet Anda (VPS atau server rumahan)

Jalankan Gateway pada host persisten dan akses melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk UI Kontrol.
- **Fallback:** tetap gunakan loopback + tunnel SSH dari mesin mana pun yang memerlukan akses.
- **Contoh:** [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi).

Ini ideal ketika laptop Anda sering tidur tetapi Anda ingin agen selalu aktif.

### 2) Desktop rumah menjalankan Gateway, laptop menjadi pengendali jarak jauh

Laptop **tidak** menjalankan agen. Laptop terhubung dari jarak jauh:

- Gunakan mode **Remote over SSH** di app macOS (Settings → General → “OpenClaw runs”).
- App membuka dan mengelola tunnel, sehingga WebChat + pemeriksaan health “langsung berfungsi”.

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

### 3) Laptop menjalankan Gateway, akses jarak jauh dari mesin lain

Pertahankan Gateway tetap lokal tetapi ekspos dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Sajikan UI Kontrol dengan Tailscale Serve dan pertahankan Gateway tetap hanya loopback.

Panduan: [Tailscale](/id/gateway/tailscale) dan [Ringkasan web](/id/web).

## Alur perintah (apa yang berjalan di mana)

Satu layanan gateway memiliki status + saluran. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agen** dan memutuskan apakah perlu memanggil tool node.
- Gateway memanggil **node** melalui WebSocket Gateway (`node.*` RPC).
- Node mengembalikan hasil; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang seharusnya berjalan per host kecuali Anda memang sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)).
- “Mode node” app macOS hanyalah klien node melalui WebSocket Gateway.

## Tunnel SSH (CLI + tool)

Buat tunnel lokal ke WebSocket Gateway jarak jauh:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Dengan tunnel aktif:

- `openclaw health` dan `openclaw status --deep` sekarang mencapai gateway jarak jauh melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url` bila diperlukan.

Catatan: ganti `18789` dengan `gateway.port` yang Anda konfigurasikan (atau `--port`/`OPENCLAW_GATEWAY_PORT`).
Catatan: saat Anda memberikan `--url`, CLI tidak fallback ke kredensial konfigurasi atau environment.
Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.

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

Saat gateway hanya loopback, pertahankan URL di `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.
Dalam transport tunnel SSH app macOS, hostname gateway yang ditemukan berada di
`gateway.remote.sshTarget`; `gateway.remote.url` tetap berupa URL tunnel lokal.

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama di seluruh jalur call/probe/status dan pemantauan exec-approval Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (secara sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau tool `gatewayToken`) selalu menang pada jalur call yang menerima auth eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan ulang kredensial konfigurasi/env implisit.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) hanya dapat menggunakan kredensial env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback jarak jauh hanya berlaku ketika input token auth lokal tidak diset)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback jarak jauh hanya berlaku ketika input password auth lokal tidak diset)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh bersifat ketat secara default: menggunakan `gateway.remote.token` saja (tanpa fallback token lokal) saat menargetkan mode jarak jauh.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## UI obrolan melalui SSH

WebChat tidak lagi menggunakan port HTTP terpisah. UI obrolan SwiftUI terhubung langsung ke WebSocket Gateway.

- Teruskan `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Di macOS, pilih mode “Remote over SSH” di app, yang mengelola tunnel secara otomatis.

## app macOS "Remote over SSH"

App menu bar macOS dapat menjalankan penyiapan yang sama secara menyeluruh (pemeriksaan status jarak jauh, WebChat, dan penerusan Voice Wake).

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (jarak jauh/VPN)

Versi singkat: **pertahankan Gateway tetap hanya loopback** kecuali Anda yakin memerlukan bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa eksposur publik).
- Plaintext `ws://` secara default hanya untuk loopback. Untuk jaringan privat tepercaya,
  set `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai
  upaya darurat. Tidak ada padanan `openclaw.json`; ini harus berada di
  environment proses untuk klien yang membuat koneksi WebSocket.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` saat loopback tidak tersedia) harus menggunakan auth gateway: token, password, atau reverse proxy sadar-identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Keduanya **tidak** mengonfigurasi auth server dengan sendirinya.
- Jalur call lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` tidak diset.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak ter-resolve, resolusi gagal secara tertutup (tanpa fallback jarak jauh yang menyamarkan masalah).
- `gateway.remote.tlsFingerprint` menyematkan sertifikat TLS jarak jauh saat menggunakan `wss://`.
- **Tailscale Serve** dapat mengautentikasi lalu lintas UI Kontrol/WebSocket melalui header identitas
  ketika `gateway.auth.allowTailscale: true`; endpoint HTTP API tidak menggunakan
  auth header Tailscale itu dan sebagai gantinya mengikuti mode auth HTTP normal
  milik gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Set ke
  `false` jika Anda ingin auth shared-secret di mana-mana.
- Auth **Trusted-proxy** hanya untuk penyiapan proxy sadar-identitas non-loopback.
  Reverse proxy loopback pada host yang sama tidak memenuhi `gateway.auth.mode: "trusted-proxy"`.
- Perlakukan kontrol browser seperti akses operator: tailnet-only + pairing node yang disengaja.

Pembahasan mendalam: [Keamanan](/id/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway jarak jauh, penyiapan persisten termudah menggunakan entri SSH `LocalForward` ditambah LaunchAgent agar tunnel tetap aktif melewati reboot dan crash.

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

Tunnel akan dimulai otomatis saat login, dimulai ulang saat crash, dan menjaga port yang diteruskan tetap aktif.

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
| `LocalForward 18789 127.0.0.1:18789`  | Meneruskan port lokal 18789 ke port jarak jauh 18789         |
| `ssh -N`                              | SSH tanpa menjalankan perintah jarak jauh (hanya port-forwarding) |
| `KeepAlive`                           | Secara otomatis memulai ulang tunnel jika crash              |
| `RunAtLoad`                           | Memulai tunnel saat LaunchAgent dimuat saat login            |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Autentikasi](/id/gateway/authentication)
- [Penyiapan gateway jarak jauh](/id/gateway/remote-gateway-readme)
