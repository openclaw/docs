---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan gateway jarak jauh
summary: Akses jarak jauh menggunakan Gateway WS, tunnel SSH, dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-06-27T17:32:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Repo ini mendukung akses gateway jarak jauh dengan menjaga satu Gateway (master) tetap berjalan di host khusus (desktop/server) dan menghubungkan klien ke sana.

- Untuk **operator (Anda / aplikasi macOS)**: WebSocket LAN/Tailnet langsung adalah yang paling sederhana ketika gateway dapat dijangkau; tunneling SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat masa depan)**: hubungkan ke **WebSocket** Gateway (LAN/tailnet atau tunnel SSH sesuai kebutuhan).

## Ide inti

- WebSocket Gateway biasanya bind ke **loopback** pada port yang Anda konfigurasi (default ke 18789).
- Untuk penggunaan jarak jauh, ekspos melalui Tailscale Serve atau bind LAN/Tailnet tepercaya, atau forward port loopback melalui SSH.

## Pengaturan VPN dan tailnet umum

Anggap **host Gateway** sebagai tempat agent berada. Host ini memiliki sesi, profil auth, channel, dan state. Laptop, desktop, dan node Anda terhubung ke host tersebut.

### Gateway selalu aktif di tailnet Anda

Jalankan Gateway di host persisten (VPS atau server rumah) dan jangkau melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk Control UI.
- **LAN/Tailnet tepercaya:** bind gateway ke antarmuka privat dan hubungkan langsung dengan `gateway.remote.transport: "direct"`.
- **Fallback:** pertahankan loopback plus tunnel SSH dari mesin mana pun yang membutuhkan akses.
- **Contoh:** [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi).

Ideal ketika laptop Anda sering sleep tetapi Anda ingin agent selalu aktif.

### Desktop rumah menjalankan Gateway

Laptop **tidak** menjalankan agent. Laptop terhubung secara jarak jauh:

- Gunakan mode jarak jauh aplikasi macOS (Settings → General → OpenClaw runs).
- Aplikasi terhubung langsung ketika gateway dapat dijangkau di LAN/Tailnet, atau membuka dan mengelola tunnel SSH ketika Anda memilih SSH.

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

### Laptop menjalankan Gateway

Pertahankan Gateway tetap lokal tetapi ekspos dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Tailscale Serve Control UI dan pertahankan Gateway hanya loopback.

Panduan: [Tailscale](/id/gateway/tailscale) dan [ikhtisar Web](/id/web).

## Alur perintah (apa berjalan di mana)

Satu layanan gateway memiliki state + channel. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agent** dan memutuskan apakah perlu memanggil tool node.
- Gateway memanggil **node** melalui WebSocket Gateway (`node.*` RPC).
- Node mengembalikan hasil; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang boleh berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)).
- "mode node" aplikasi macOS hanyalah klien node melalui WebSocket Gateway.

## Tunnel SSH (CLI + tool)

Buat tunnel lokal ke Gateway WS jarak jauh:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Dengan tunnel aktif:

- `openclaw health` dan `openclaw status --deep` sekarang menjangkau gateway jarak jauh melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang di-forward melalui `--url` bila perlu.

<Note>
Ganti `18789` dengan `gateway.port` yang Anda konfigurasi (atau `--port` atau `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Ketika Anda meneruskan `--url`, CLI tidak fallback ke kredensial config atau environment. Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
</Warning>

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

Ketika gateway hanya loopback, pertahankan URL di `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.
Dalam transport tunnel SSH aplikasi macOS, hostname gateway yang ditemukan berada di
`gateway.remote.sshTarget`; `gateway.remote.url` tetap menjadi URL tunnel lokal.
Jika port tersebut berbeda, set `gateway.remote.remotePort` ke port gateway pada
host SSH.

Untuk gateway yang sudah dapat dijangkau di LAN atau Tailnet tepercaya, gunakan mode langsung:

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

Resolusi kredensial Gateway mengikuti satu kontrak bersama di seluruh path call/probe/status dan pemantauan persetujuan eksekusi Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (secara sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau tool `gatewayToken`) selalu menang pada path call yang menerima auth eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan ulang kredensial config/env implisit.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) dapat menggunakan kredensial env saja (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback jarak jauh hanya berlaku ketika input token auth lokal belum disetel)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback jarak jauh hanya berlaku ketika input password auth lokal belum disetel)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh strict secara default: pemeriksaan tersebut hanya menggunakan `gateway.remote.token` (tanpa fallback token lokal) ketika menargetkan mode jarak jauh.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## Akses jarak jauh Chat UI

WebChat tidak lagi menggunakan port HTTP terpisah. Chat UI SwiftUI terhubung langsung ke WebSocket Gateway.

- Forward `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Untuk mode langsung LAN/Tailnet, hubungkan klien ke URL `ws://` privat yang dikonfigurasi atau URL aman `wss://`.
- Di macOS, utamakan mode jarak jauh aplikasi, yang mengelola transport yang dipilih secara otomatis.

## Mode jarak jauh aplikasi macOS

Aplikasi bilah menu macOS dapat menjalankan pengaturan yang sama secara end-to-end (pemeriksaan status jarak jauh, WebChat, dan forwarding Voice Wake).

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (jarak jauh/VPN)

Versi singkat: **pertahankan Gateway hanya loopback** kecuali Anda yakin membutuhkan bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa eksposur publik).
- Plaintext `ws://` diterima untuk loopback, LAN, link-local, `.local`, `.ts.net`, dan host CGNAT Tailscale. Host jarak jauh publik harus menggunakan `wss://`.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` ketika loopback tidak tersedia) harus menggunakan auth gateway: token, password, atau reverse proxy identity-aware dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Keduanya **tidak** mengonfigurasi auth server dengan sendirinya.
- Path call lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya ketika `gateway.auth.*` belum disetel.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tidak ada masking fallback jarak jauh).
- `gateway.remote.tlsFingerprint` menyematkan sertifikat TLS jarak jauh saat menggunakan `wss://`, termasuk mode langsung macOS. Tanpa pin yang dikonfigurasi atau sebelumnya disimpan, macOS hanya menyematkan sertifikat penggunaan pertama setelah kepercayaan sistem normal lolos; gateway self-signed atau private-CA yang belum dipercaya macOS memerlukan fingerprint eksplisit atau Remote melalui SSH.
- **Tailscale Serve** dapat mengautentikasi traffic Control UI/WebSocket melalui header identity
  ketika `gateway.auth.allowTailscale: true`; endpoint HTTP API tidak
  menggunakan auth header Tailscale tersebut dan sebagai gantinya mengikuti mode auth HTTP normal
  gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Setel ke
  `false` jika Anda menginginkan auth shared-secret di mana-mana.
- Auth **trusted-proxy** mengharapkan pengaturan proxy identity-aware non-loopback secara default.
  Reverse proxy loopback host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Perlakukan kontrol browser seperti akses operator: hanya tailnet + pairing node yang disengaja.

Pendalaman: [Keamanan](/id/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway jarak jauh, pengaturan persisten termudah menggunakan entri config `LocalForward` SSH plus LaunchAgent untuk menjaga tunnel tetap hidup melewati reboot dan crash.

#### Langkah 1: tambahkan config SSH

Edit `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ganti `<REMOTE_IP>` dan `<REMOTE_USER>` dengan nilai Anda.

#### Langkah 2: salin kunci SSH (sekali)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Langkah 3: konfigurasi token gateway

Simpan token di config agar tetap ada setelah restart:

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

Tunnel akan mulai otomatis saat login, restart saat crash, dan menjaga port yang di-forward tetap aktif.

<Note>
Jika Anda memiliki LaunchAgent `com.openclaw.ssh-tunnel` sisa dari pengaturan lama, unload dan hapus.
</Note>

#### Pemecahan masalah

Periksa apakah tunnel sedang berjalan:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Hentikan tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entri config                         | Apa yang dilakukan                                           |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Meneruskan port lokal 18789 ke port jarak jauh 18789         |
| `ssh -N`                             | SSH tanpa menjalankan perintah jarak jauh (hanya port-forwarding) |
| `KeepAlive`                          | Me-restart tunnel secara otomatis jika crash                 |
| `RunAtLoad`                          | Memulai tunnel ketika LaunchAgent dimuat saat login          |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Autentikasi](/id/gateway/authentication)
- [Pengaturan gateway jarak jauh](/id/gateway/remote-gateway-readme)
