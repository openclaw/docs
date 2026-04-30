---
read_when:
    - Menerapkan OpenClaw di Fly.io
    - Menyiapkan volume Fly, rahasia, dan konfigurasi saat pertama kali dijalankan
summary: Penerapan Fly.io langkah demi langkah untuk OpenClaw dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T09:56:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Penerapan Fly.io

**Tujuan:** OpenClaw Gateway berjalan di mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, dan akses Discord/kanal.

## Yang Anda perlukan

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) terinstal
- Akun Fly.io (tingkat gratis dapat digunakan)
- Autentikasi model: kunci API untuk penyedia model pilihan Anda
- Kredensial kanal: token bot Discord, token Telegram, dan sebagainya.

## Jalur cepat untuk pemula

1. Clone repo → sesuaikan `fly.toml`
2. Buat aplikasi + volume → tetapkan secret
3. Deploy dengan `fly deploy`
4. SSH masuk untuk membuat konfigurasi atau gunakan Control UI

<Steps>
  <Step title="Buat aplikasi Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tip:** Pilih region yang dekat dengan Anda. Opsi umum: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Konfigurasikan fly.toml">
    Edit `fly.toml` agar cocok dengan nama aplikasi dan kebutuhan Anda.

    **Catatan keamanan:** Konfigurasi default mengekspos URL publik. Untuk penerapan yang diperkuat tanpa IP publik, lihat [Penerapan privat](#private-deployment-hardened) atau gunakan `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Pengaturan utama:**

    | Pengaturan                    | Alasan                                                                      |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Bind ke `0.0.0.0` agar proxy Fly dapat menjangkau Gateway                   |
    | `--allow-unconfigured`        | Mulai tanpa file konfigurasi (Anda akan membuatnya setelahnya)              |
    | `internal_port = 3000`        | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk pemeriksaan kesehatan Fly |
    | `memory = "2048mb"`           | 512MB terlalu kecil; 2GB direkomendasikan                                   |
    | `OPENCLAW_STATE_DIR = "/data"` | Mempertahankan state pada volume                                            |

  </Step>

  <Step title="Tetapkan secret">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Catatan:**

    - Bind non-loopback (`--bind lan`) memerlukan jalur autentikasi Gateway yang valid. Contoh Fly.io ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau penerapan `trusted-proxy` non-loopback yang dikonfigurasi dengan benar juga memenuhi persyaratan tersebut.
    - Perlakukan token ini seperti kata sandi.
    - **Utamakan variabel env daripada file konfigurasi** untuk semua kunci API dan token. Ini menjaga secret tetap di luar `openclaw.json` agar tidak terekspos atau tercatat secara tidak sengaja.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Deploy pertama membangun image Docker (~2-3 menit). Deploy berikutnya lebih cepat.

    Setelah penerapan, verifikasi:

    ```bash
    fly status
    fly logs
    ```

    Anda akan melihat:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Buat file konfigurasi">
    SSH masuk ke mesin untuk membuat konfigurasi yang benar:

    ```bash
    fly ssh console
    ```

    Buat direktori dan file konfigurasi:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Catatan:** Dengan `OPENCLAW_STATE_DIR=/data`, path konfigurasi adalah `/data/openclaw.json`.

    **Catatan:** Ganti `https://my-openclaw.fly.dev` dengan origin aplikasi Fly Anda yang sebenarnya. Startup Gateway menanamkan origin Control UI lokal dari nilai runtime `--bind` dan `--port` sehingga boot pertama dapat berjalan sebelum konfigurasi ada, tetapi akses browser melalui Fly tetap memerlukan origin HTTPS persis yang tercantum di `gateway.controlUi.allowedOrigins`.

    **Catatan:** Token Discord dapat berasal dari salah satu:

    - Variabel lingkungan: `DISCORD_BOT_TOKEN` (direkomendasikan untuk secret)
    - File konfigurasi: `channels.discord.token`

    Jika menggunakan variabel env, Anda tidak perlu menambahkan token ke konfigurasi. Gateway membaca `DISCORD_BOT_TOKEN` secara otomatis.

    Mulai ulang untuk menerapkan:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Akses Gateway">
    ### Control UI

    Buka di browser:

    ```bash
    fly open
    ```

    Atau kunjungi `https://my-openclaw.fly.dev/`

    Autentikasi dengan secret bersama yang dikonfigurasi. Panduan ini menggunakan token Gateway dari `OPENCLAW_GATEWAY_TOKEN`; jika Anda beralih ke autentikasi kata sandi, gunakan kata sandi tersebut sebagai gantinya.

    ### Log

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Konsol SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Pemecahan masalah

### "App is not listening on expected address"

Gateway sedang bind ke `127.0.0.1` alih-alih `0.0.0.0`.

**Perbaikan:** Tambahkan `--bind lan` ke perintah proses Anda di `fly.toml`.

### Pemeriksaan kesehatan gagal / koneksi ditolak

Fly tidak dapat menjangkau Gateway pada port yang dikonfigurasi.

**Perbaikan:** Pastikan `internal_port` cocok dengan port Gateway (tetapkan `--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Masalah memori

Container terus dimulai ulang atau dihentikan. Tanda-tandanya: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau restart senyap.

**Perbaikan:** Tingkatkan memori di `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang sudah ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Catatan:** 512MB terlalu kecil. 1GB mungkin berfungsi tetapi dapat mengalami OOM saat beban tinggi atau dengan logging verbose. **2GB direkomendasikan.**

### Masalah lock Gateway

Gateway menolak memulai dengan error "already running".

Ini terjadi saat container dimulai ulang tetapi file lock PID tetap ada pada volume.

**Perbaikan:** Hapus file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File lock berada di `/data/gateway.*.lock` (bukan di subdirektori).

### Konfigurasi tidak dibaca

`--allow-unconfigured` hanya melewati guard startup. Itu tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi sebenarnya ada dan mencakup `gateway.mode="local"` saat Anda menginginkan startup Gateway lokal normal.

Verifikasi bahwa konfigurasi ada:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Menulis konfigurasi melalui SSH

Perintah `fly ssh console -C` tidak mendukung redirection shell. Untuk menulis file konfigurasi:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Catatan:** `fly sftp` mungkin gagal jika file sudah ada. Hapus terlebih dahulu:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State tidak persisten

Jika Anda kehilangan profil autentikasi, state kanal/penyedia, atau sesi setelah restart, direktori state sedang menulis ke filesystem container.

**Perbaikan:** Pastikan `OPENCLAW_STATE_DIR=/data` ditetapkan di `fly.toml` dan deploy ulang.

## Pembaruan

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Memperbarui perintah mesin

Jika Anda perlu mengubah perintah startup tanpa redeploy penuh:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Catatan:** Setelah `fly deploy`, perintah mesin dapat direset ke yang ada di `fly.toml`. Jika Anda membuat perubahan manual, terapkan ulang setelah deploy.

## Penerapan privat (diperkuat)

Secara default, Fly mengalokasikan IP publik, sehingga Gateway Anda dapat diakses di `https://your-app.fly.dev`. Ini praktis, tetapi berarti penerapan Anda dapat ditemukan oleh pemindai internet (Shodan, Censys, dan sebagainya).

Untuk penerapan yang diperkuat dengan **tanpa eksposur publik**, gunakan template privat.

### Kapan menggunakan penerapan privat

- Anda hanya membuat panggilan/pesan **keluar** (tanpa Webhook masuk)
- Anda menggunakan tunnel **ngrok atau Tailscale** untuk callback Webhook apa pun
- Anda mengakses Gateway melalui **SSH, proxy, atau WireGuard** alih-alih browser
- Anda ingin penerapan **tersembunyi dari pemindai internet**

### Penyiapan

Gunakan `fly.private.toml` alih-alih konfigurasi standar:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Atau konversi penerapan yang sudah ada:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Setelah ini, `fly ips list` seharusnya hanya menampilkan IP bertipe `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Mengakses penerapan privat

Karena tidak ada URL publik, gunakan salah satu metode berikut:

**Opsi 1: Proxy lokal (paling sederhana)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opsi 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Opsi 3: SSH saja**

```bash
fly ssh console -a my-openclaw
```

### Webhook dengan deployment privat

Jika Anda memerlukan callback Webhook (Twilio, Telnyx, dll.) tanpa paparan publik:

1. **Tunnel ngrok** - Jalankan ngrok di dalam kontainer atau sebagai kontainer pendamping
2. **Tailscale Funnel** - Paparkan path tertentu melalui Tailscale
3. **Hanya outbound** - Beberapa penyedia (Twilio) berfungsi baik untuk panggilan outbound tanpa Webhook

Contoh konfigurasi panggilan suara dengan ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Tunnel ngrok berjalan di dalam kontainer dan menyediakan URL Webhook publik tanpa mengekspos aplikasi Fly itu sendiri. Atur `webhookSecurity.allowedHosts` ke nama host tunnel publik agar header host yang diteruskan diterima.

### Manfaat keamanan

| Aspek              | Publik        | Privat         |
| ------------------ | ------------- | -------------- |
| Pemindai internet  | Dapat ditemukan | Tersembunyi  |
| Serangan langsung  | Mungkin       | Diblokir       |
| Akses UI kontrol   | Peramban      | Proxy/VPN      |
| Pengiriman Webhook | Langsung      | Melalui tunnel |

## Catatan

- Fly.io menggunakan **arsitektur x86** (bukan ARM)
- Dockerfile kompatibel dengan kedua arsitektur
- Untuk onboarding WhatsApp/Telegram, gunakan `fly ssh console`
- Data persisten berada di volume pada `/data`
- Signal memerlukan Java + signal-cli; gunakan image kustom dan pertahankan memori pada 2GB+.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2GB):

- ~$10-15/bulan tergantung penggunaan
- Tingkat gratis mencakup sejumlah kuota

Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk detail.

## Langkah berikutnya

- Siapkan kanal perpesanan: [Kanal](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Selalu perbarui OpenClaw: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Hetzner](/id/install/hetzner)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
