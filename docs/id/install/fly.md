---
read_when:
    - Menerapkan OpenClaw di Fly.io
    - Menyiapkan volume, rahasia, dan konfigurasi saat pertama kali dijalankan untuk Fly
summary: Penerapan Fly.io langkah demi langkah untuk OpenClaw dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-06T17:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 534a94e4ff69542604ba3112d468b7274492c18b3c5054f47379c21421f518bd
    source_path: install/fly.md
    workflow: 16
---

**Tujuan:** OpenClaw Gateway berjalan di mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, dan akses Discord/saluran.

## Yang Anda perlukan

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) terinstal
- Akun Fly.io (tingkat gratis bisa digunakan)
- Autentikasi model: kunci API untuk penyedia model pilihan Anda
- Kredensial saluran: token bot Discord, token Telegram, dll.

## Jalur cepat pemula

1. Clone repo → sesuaikan `fly.toml`
2. Buat app + volume → setel secret
3. Deploy dengan `fly deploy`
4. Masuk lewat SSH untuk membuat konfigurasi atau gunakan UI Kontrol

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Kiat:** Pilih region yang dekat dengan Anda. Opsi umum: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Edit `fly.toml` agar sesuai dengan nama app dan kebutuhan Anda.

    **Catatan keamanan:** Konfigurasi default mengekspos URL publik. Untuk deployment yang diperkeras tanpa IP publik, lihat [Deployment Privat](#private-deployment-hardened) atau gunakan `deploy/fly.private.toml`.

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

    **Pengaturan kunci:**

    | Pengaturan                    | Alasan                                                                     |
    | ----------------------------- | -------------------------------------------------------------------------- |
    | `--bind lan`                  | Melakukan bind ke `0.0.0.0` agar proxy Fly dapat menjangkau Gateway        |
    | `--allow-unconfigured`        | Mulai tanpa file konfigurasi (Anda akan membuatnya setelah itu)            |
    | `internal_port = 3000`        | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk health check Fly |
    | `memory = "2048mb"`           | 512MB terlalu kecil; 2GB direkomendasikan                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | Mempertahankan state di volume                                             |

  </Step>

  <Step title="Set secrets">
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

    - Bind non-loopback (`--bind lan`) memerlukan jalur autentikasi Gateway yang valid. Contoh Fly.io ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar juga memenuhi persyaratan tersebut.
    - Perlakukan token ini seperti kata sandi.
    - **Lebih pilih env var daripada file konfigurasi** untuk semua kunci API dan token. Ini menjaga secret tetap di luar `openclaw.json` agar tidak tidak sengaja terekspos atau tercatat di log.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Deploy pertama membangun image Docker (~2-3 menit). Deploy berikutnya lebih cepat.

    Setelah deployment, verifikasi:

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

  <Step title="Create config file">
    Masuk ke mesin lewat SSH untuk membuat konfigurasi yang tepat:

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

    **Catatan:** Ganti `https://my-openclaw.fly.dev` dengan origin app Fly Anda yang sebenarnya. Startup Gateway mengisi origin UI Kontrol lokal dari nilai runtime `--bind` dan `--port` agar boot pertama dapat berjalan sebelum konfigurasi ada, tetapi akses browser melalui Fly tetap membutuhkan origin HTTPS persis yang tercantum di `gateway.controlUi.allowedOrigins`.

    **Catatan:** Token Discord dapat berasal dari salah satu:

    - Variabel lingkungan: `DISCORD_BOT_TOKEN` (direkomendasikan untuk secret)
    - File konfigurasi: `channels.discord.token`

    Jika menggunakan env var, tidak perlu menambahkan token ke konfigurasi. Gateway membaca `DISCORD_BOT_TOKEN` secara otomatis.

    Restart untuk menerapkan:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### UI Kontrol

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

Gateway melakukan bind ke `127.0.0.1`, bukan `0.0.0.0`.

**Perbaikan:** Tambahkan `--bind lan` ke perintah proses Anda di `fly.toml`.

### Health check gagal / koneksi ditolak

Fly tidak dapat menjangkau Gateway pada port yang dikonfigurasi.

**Perbaikan:** Pastikan `internal_port` cocok dengan port Gateway (setel `--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Masalah memori

Container terus restart atau dihentikan paksa. Tanda-tanda: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau restart diam-diam.

**Perbaikan:** Tingkatkan memori di `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Catatan:** 512MB terlalu kecil. 1GB mungkin berfungsi tetapi dapat OOM saat beban tinggi atau dengan logging verbose. **2GB direkomendasikan.**

### Masalah lock Gateway

Gateway menolak mulai dengan error "already running".

Ini terjadi ketika container restart tetapi file lock PID tetap ada di volume.

**Perbaikan:** Hapus file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File lock berada di `/data/gateway.*.lock` (bukan di subdirektori).

### Konfigurasi tidak dibaca

`--allow-unconfigured` hanya melewati penjaga startup. Itu tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi asli Anda ada dan menyertakan `gateway.mode="local"` ketika Anda menginginkan startup Gateway lokal normal.

Verifikasi konfigurasi ada:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Menulis konfigurasi melalui SSH

Perintah `fly ssh console -C` tidak mendukung pengalihan shell. Untuk menulis file konfigurasi:

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

Jika Anda kehilangan profil autentikasi, state saluran/penyedia, atau sesi setelah restart, direktori state sedang menulis ke filesystem container.

**Perbaikan:** Pastikan `OPENCLAW_STATE_DIR=/data` disetel di `fly.toml` dan deploy ulang.

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

**Catatan:** Setelah `fly deploy`, perintah mesin mungkin direset ke yang ada di `fly.toml`. Jika Anda membuat perubahan manual, terapkan ulang setelah deploy.

## Deployment privat (diperkeras)

Secara default, Fly mengalokasikan IP publik, sehingga Gateway Anda dapat diakses di `https://your-app.fly.dev`. Ini nyaman tetapi berarti deployment Anda dapat ditemukan oleh pemindai internet (Shodan, Censys, dll.).

Untuk deployment yang diperkeras dengan **tanpa eksposur publik**, gunakan template privat.

### Kapan menggunakan deployment privat

- Anda hanya membuat panggilan/pesan **keluar** (tanpa Webhook masuk)
- Anda menggunakan tunnel **ngrok atau Tailscale** untuk callback Webhook apa pun
- Anda mengakses Gateway melalui **SSH, proxy, atau WireGuard**, bukan browser
- Anda ingin deployment **tersembunyi dari pemindai internet**

### Penyiapan

Gunakan `deploy/fly.private.toml`, bukan konfigurasi standar:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Atau konversi deployment yang ada:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Setelah ini, `fly ips list` hanya akan menampilkan IP bertipe `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Mengakses deployment privat

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

**Opsi 3: Hanya SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook dengan deployment privat

Jika Anda memerlukan callback Webhook (Twilio, Telnyx, dll.) tanpa eksposur publik:

1. **Tunnel ngrok** - Jalankan ngrok di dalam kontainer atau sebagai sidecar
2. **Tailscale Funnel** - Ekspos path tertentu melalui Tailscale
3. **Hanya keluar** - Beberapa penyedia (Twilio) berfungsi baik untuk panggilan keluar tanpa Webhook

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

Tunnel ngrok berjalan di dalam kontainer dan menyediakan URL Webhook publik tanpa mengekspos aplikasi Fly itu sendiri. Atur `webhookSecurity.allowedHosts` ke hostname tunnel publik agar header host yang diteruskan diterima.

### Manfaat keamanan

| Aspek             | Publik             | Privat       |
| ----------------- | ------------------ | ------------ |
| Pemindai internet | Dapat ditemukan    | Tersembunyi  |
| Serangan langsung | Mungkin            | Diblokir     |
| Akses UI kontrol  | Browser            | Proxy/VPN    |
| Pengiriman Webhook | Langsung          | Melalui tunnel |

## Catatan

- Fly.io menggunakan **arsitektur x86** (bukan ARM)
- Dockerfile kompatibel dengan kedua arsitektur
- Untuk onboarding WhatsApp/Telegram, gunakan `fly ssh console`
- Data persisten berada di volume pada `/data`
- Signal memerlukan Java + signal-cli; gunakan image kustom dan pertahankan memori pada 2GB+.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2GB):

- ~$10-15/bulan tergantung penggunaan
- Tingkat gratis mencakup sebagian alokasi

Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk detail.

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw tetap mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Hetzner](/id/install/hetzner)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
