---
read_when:
    - Menjalankan atau memecahkan masalah penyiapan Gateway jarak jauh
summary: Akses jarak jauh menggunakan tunnel SSH (Gateway WS) dan tailnet
title: Akses jarak jauh
x-i18n:
    generated_at: "2026-04-30T09:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Repo ini mendukung “remote over SSH” dengan menjaga satu Gateway (master) berjalan di host khusus (desktop/server) dan menghubungkan klien ke sana.

- Untuk **operator (Anda / aplikasi macOS)**: tunneling SSH adalah fallback universal.
- Untuk **node (iOS/Android dan perangkat mendatang)**: hubungkan ke **WebSocket** Gateway (LAN/tailnet atau tunnel SSH sesuai kebutuhan).

## Ide inti

- WebSocket Gateway bind ke **loopback** pada port yang Anda konfigurasi (default ke 18789).
- Untuk penggunaan jarak jauh, Anda meneruskan port loopback itu melalui SSH (atau menggunakan tailnet/VPN dan lebih sedikit tunnel).

## Pengaturan VPN dan tailnet umum

Anggap **host Gateway** sebagai tempat agent berada. Host ini memiliki sesi, profil auth, channel, dan state. Laptop, desktop, dan node Anda terhubung ke host tersebut.

### Gateway selalu aktif di tailnet Anda

Jalankan Gateway pada host persisten (VPS atau server rumah) dan akses melalui **Tailscale** atau SSH.

- **UX terbaik:** pertahankan `gateway.bind: "loopback"` dan gunakan **Tailscale Serve** untuk Control UI.
- **Fallback:** pertahankan loopback plus tunnel SSH dari mesin mana pun yang membutuhkan akses.
- **Contoh:** [exe.dev](/id/install/exe-dev) (VM mudah) atau [Hetzner](/id/install/hetzner) (VPS produksi).

Ideal ketika laptop Anda sering sleep tetapi Anda ingin agent selalu aktif.

### Desktop rumah menjalankan Gateway

Laptop **tidak** menjalankan agent. Laptop terhubung secara jarak jauh:

- Gunakan mode **Remote over SSH** aplikasi macOS (Settings → General → OpenClaw runs).
- Aplikasi membuka dan mengelola tunnel, sehingga WebChat dan health check langsung berfungsi.

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

### Laptop menjalankan Gateway

Pertahankan Gateway tetap lokal tetapi ekspos dengan aman:

- Tunnel SSH ke laptop dari mesin lain, atau
- Tailscale Serve Control UI dan pertahankan Gateway hanya loopback.

Panduan: [Tailscale](/id/gateway/tailscale) dan [ikhtisar Web](/id/web).

## Alur perintah (apa yang berjalan di mana)

Satu layanan gateway memiliki state + channel. Node adalah periferal.

Contoh alur (Telegram → node):

- Pesan Telegram tiba di **Gateway**.
- Gateway menjalankan **agent** dan memutuskan apakah perlu memanggil tool node.
- Gateway memanggil **node** melalui WebSocket Gateway (`node.*` RPC).
- Node mengembalikan hasilnya; Gateway membalas kembali ke Telegram.

Catatan:

- **Node tidak menjalankan layanan gateway.** Hanya satu gateway yang seharusnya berjalan per host kecuali Anda sengaja menjalankan profil terisolasi (lihat [Beberapa gateway](/id/gateway/multiple-gateways)).
- “mode node” aplikasi macOS hanyalah klien node melalui WebSocket Gateway.

## Tunnel SSH (CLI + tool)

Buat tunnel lokal ke WS Gateway jarak jauh:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Dengan tunnel aktif:

- `openclaw health` dan `openclaw status --deep` sekarang menjangkau gateway jarak jauh melalui `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, dan `openclaw gateway call` juga dapat menargetkan URL yang diteruskan melalui `--url` bila diperlukan.

<Note>
Ganti `18789` dengan `gateway.port` yang Anda konfigurasi (atau `--port` atau `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Saat Anda meneruskan `--url`, CLI tidak fallback ke kredensial konfigurasi atau environment. Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.
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

Saat gateway hanya loopback, pertahankan URL pada `ws://127.0.0.1:18789` dan buka tunnel SSH terlebih dahulu.
Dalam transport tunnel SSH aplikasi macOS, hostname gateway yang ditemukan berada di
`gateway.remote.sshTarget`; `gateway.remote.url` tetap berupa URL tunnel lokal.

## Prioritas kredensial

Resolusi kredensial Gateway mengikuti satu kontrak bersama di seluruh jalur call/probe/status dan pemantauan persetujuan eksekusi Discord. Node-host menggunakan kontrak dasar yang sama dengan satu pengecualian mode lokal (secara sengaja mengabaikan `gateway.remote.*`):

- Kredensial eksplisit (`--token`, `--password`, atau tool `gatewayToken`) selalu menang pada jalur call yang menerima auth eksplisit.
- Keamanan override URL:
  - Override URL CLI (`--url`) tidak pernah menggunakan kembali kredensial config/env implisit.
  - Override URL env (`OPENCLAW_GATEWAY_URL`) hanya boleh menggunakan kredensial env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Default mode lokal:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback jarak jauh hanya berlaku saat input token auth lokal tidak disetel)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback jarak jauh hanya berlaku saat input password auth lokal tidak disetel)
- Default mode jarak jauh:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Pengecualian mode lokal Node-host: `gateway.remote.token` / `gateway.remote.password` diabaikan.
- Pemeriksaan token probe/status jarak jauh bersifat ketat secara default: pemeriksaan menggunakan `gateway.remote.token` saja (tanpa fallback token lokal) saat menargetkan mode jarak jauh.
- Override env Gateway hanya menggunakan `OPENCLAW_GATEWAY_*`.

## Chat UI melalui SSH

WebChat tidak lagi menggunakan port HTTP terpisah. UI chat SwiftUI terhubung langsung ke WebSocket Gateway.

- Teruskan `18789` melalui SSH (lihat di atas), lalu hubungkan klien ke `ws://127.0.0.1:18789`.
- Di macOS, pilih mode “Remote over SSH” aplikasi, yang mengelola tunnel secara otomatis.

## Remote over SSH aplikasi macOS

Aplikasi menu bar macOS dapat menjalankan pengaturan yang sama dari awal hingga akhir (pemeriksaan status jarak jauh, WebChat, dan penerusan Voice Wake).

Runbook: [akses jarak jauh macOS](/id/platforms/mac/remote).

## Aturan keamanan (remote/VPN)

Versi singkat: **pertahankan Gateway hanya loopback** kecuali Anda yakin membutuhkan bind.

- **Loopback + SSH/Tailscale Serve** adalah default paling aman (tanpa eksposur publik).
- Plaintext `ws://` secara default hanya loopback. Untuk jaringan privat tepercaya,
  setel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` pada proses klien sebagai
  tindakan darurat. Tidak ada padanan `openclaw.json`; ini harus berupa
  environment proses untuk klien yang membuat koneksi WebSocket.
- **Bind non-loopback** (`lan`/`tailnet`/`custom`, atau `auto` saat loopback tidak tersedia) harus menggunakan auth gateway: token, password, atau reverse proxy sadar identitas dengan `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` adalah sumber kredensial klien. Keduanya **tidak** mengonfigurasi auth server dengan sendirinya.
- Jalur call lokal dapat menggunakan `gateway.remote.*` sebagai fallback hanya saat `gateway.auth.*` tidak disetel.
- Jika `gateway.auth.token` / `gateway.auth.password` dikonfigurasi secara eksplisit melalui SecretRef dan tidak terselesaikan, resolusi gagal tertutup (tidak ada fallback jarak jauh yang menutupi).
- `gateway.remote.tlsFingerprint` mem-pin sertifikat TLS jarak jauh saat menggunakan `wss://`.
- **Tailscale Serve** dapat mengautentikasi trafik Control UI/WebSocket melalui header identitas saat `gateway.auth.allowTailscale: true`; endpoint HTTP API tidak
  menggunakan auth header Tailscale tersebut dan sebagai gantinya mengikuti mode auth HTTP normal milik gateway. Alur tanpa token ini mengasumsikan host gateway tepercaya. Setel ke
  `false` jika Anda menginginkan auth shared-secret di semua tempat.
- Auth **trusted-proxy** secara default mengharapkan pengaturan proxy sadar identitas non-loopback.
  Reverse proxy loopback pada host yang sama memerlukan `gateway.auth.trustedProxy.allowLoopback = true` secara eksplisit.
- Perlakukan kontrol browser seperti akses operator: hanya tailnet + pairing node yang disengaja.

Pembahasan mendalam: [Keamanan](/id/gateway/security).

### macOS: tunnel SSH persisten melalui LaunchAgent

Untuk klien macOS yang terhubung ke gateway jarak jauh, pengaturan persisten paling mudah menggunakan entri konfigurasi SSH `LocalForward` plus LaunchAgent agar tunnel tetap hidup melewati reboot dan crash.

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

#### Langkah 2: salin kunci SSH (sekali saja)

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

Tunnel akan mulai otomatis saat login, restart saat crash, dan menjaga port yang diteruskan tetap hidup.

<Note>
Jika Anda memiliki LaunchAgent `com.openclaw.ssh-tunnel` sisa dari pengaturan lama, unload dan hapus.
</Note>

#### Pemecahan masalah

Periksa apakah tunnel berjalan:

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

| Entri config                         | Fungsinya                                                    |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Meneruskan port lokal 18789 ke port jarak jauh 18789         |
| `ssh -N`                             | SSH tanpa menjalankan perintah jarak jauh (hanya penerusan port) |
| `KeepAlive`                          | Restart tunnel secara otomatis jika crash                    |
| `RunAtLoad`                          | Memulai tunnel saat LaunchAgent dimuat pada login            |

## Terkait

- [Tailscale](/id/gateway/tailscale)
- [Autentikasi](/id/gateway/authentication)
- [Pengaturan gateway jarak jauh](/id/gateway/remote-gateway-readme)
