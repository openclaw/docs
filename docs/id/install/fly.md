---
read_when:
    - Men-deploy OpenClaw di Fly.io
    - Menyiapkan volume Fly, secret, dan konfigurasi first-run
summary: Deployment Fly.io langkah demi langkah untuk OpenClaw dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:32:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Deployment Fly.io

**Tujuan:** Gateway OpenClaw berjalan di mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, dan akses Discord/saluran.

## Yang Anda butuhkan

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) terpasang
- Akun Fly.io (tier gratis cukup)
- Auth model: API key untuk provider model pilihan Anda
- Kredensial saluran: token bot Discord, token Telegram, dll.

## Jalur cepat untuk pemula

1. Clone repo → sesuaikan `fly.toml`
2. Buat app + volume → set secret
3. Deploy dengan `fly deploy`
4. SSH masuk untuk membuat konfigurasi atau gunakan UI Kontrol

<Steps>
  <Step title="Buat app Fly">
    ```bash
    # Clone repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Buat app Fly baru (pilih nama Anda sendiri)
    fly apps create my-openclaw

    # Buat volume persisten (1GB biasanya cukup)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Tip:** Pilih region yang dekat dengan Anda. Opsi umum: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Konfigurasikan fly.toml">
    Edit `fly.toml` agar cocok dengan nama app dan kebutuhan Anda.

    **Catatan keamanan:** Konfigurasi default mengekspos URL publik. Untuk deployment yang diperkeras tanpa IP publik, lihat [Deployment Privat](#private-deployment-hardened) atau gunakan `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nama app Anda
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

    | Pengaturan                     | Alasannya                                                                  |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Bind ke `0.0.0.0` agar proxy Fly dapat menjangkau gateway                  |
    | `--allow-unconfigured`         | Memulai tanpa file konfigurasi (Anda akan membuatnya nanti)                |
    | `internal_port = 3000`         | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk health check Fly |
    | `memory = "2048mb"`            | 512MB terlalu kecil; 2GB direkomendasikan                                  |
    | `OPENCLAW_STATE_DIR = "/data"` | Menyimpan status secara persisten di volume                                |

  </Step>

  <Step title="Set secret">
    ```bash
    # Wajib: token Gateway (untuk bind non-loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API key provider model
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Opsional: provider lain
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Token saluran
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Catatan:**

    - Bind non-loopback (`--bind lan`) memerlukan jalur auth gateway yang valid. Contoh Fly.io ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar juga memenuhi syarat.
    - Perlakukan token-token ini seperti password.
    - **Utamakan variabel env daripada file konfigurasi** untuk semua API key dan token. Ini menjaga secret tetap di luar `openclaw.json` agar tidak terekspos atau tercatat secara tidak sengaja.

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

    Anda seharusnya melihat:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Buat file konfigurasi">
    SSH ke mesin untuk membuat konfigurasi yang benar:

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

    **Catatan:** Ganti `https://my-openclaw.fly.dev` dengan origin app Fly Anda
    yang sebenarnya. Startup Gateway mengisi origin UI Kontrol lokal dari nilai runtime
    `--bind` dan `--port` sehingga boot pertama dapat berjalan sebelum konfigurasi ada,
    tetapi akses browser melalui Fly tetap memerlukan origin HTTPS persis yang dicantumkan di
    `gateway.controlUi.allowedOrigins`.

    **Catatan:** Token Discord dapat berasal dari salah satu:

    - Variabel environment: `DISCORD_BOT_TOKEN` (direkomendasikan untuk secret)
    - File konfigurasi: `channels.discord.token`

    Jika menggunakan variabel env, tidak perlu menambahkan token ke konfigurasi. Gateway membaca `DISCORD_BOT_TOKEN` secara otomatis.

    Mulai ulang untuk menerapkan:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Akses Gateway">
    ### UI Kontrol

    Buka di browser:

    ```bash
    fly open
    ```

    Atau kunjungi `https://my-openclaw.fly.dev/`

    Autentikasi dengan shared secret yang dikonfigurasi. Panduan ini menggunakan token gateway
    dari `OPENCLAW_GATEWAY_TOKEN`; jika Anda beralih ke auth password, gunakan
    password tersebut.

    ### Log

    ```bash
    fly logs              # Log langsung
    fly logs --no-tail    # Log terbaru
    ```

    ### Konsol SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Pemecahan masalah

### "App is not listening on expected address"

Gateway bind ke `127.0.0.1` alih-alih `0.0.0.0`.

**Perbaikan:** Tambahkan `--bind lan` ke perintah proses Anda di `fly.toml`.

### Health check gagal / connection refused

Fly tidak dapat menjangkau gateway pada port yang dikonfigurasi.

**Perbaikan:** Pastikan `internal_port` cocok dengan port gateway (set `--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Masalah memori

Kontainer terus restart atau dimatikan. Tanda-tandanya: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau restart diam-diam.

**Perbaikan:** Tingkatkan memori di `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Catatan:** 512MB terlalu kecil. 1GB mungkin bekerja tetapi dapat OOM saat beban tinggi atau dengan logging verbose. **2GB direkomendasikan.**

### Masalah lock Gateway

Gateway menolak start dengan error "already running".

Ini terjadi saat kontainer restart tetapi file lock PID tetap ada pada volume.

**Perbaikan:** Hapus file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File lock berada di `/data/gateway.*.lock` (bukan dalam subdirektori).

### Konfigurasi tidak terbaca

`--allow-unconfigured` hanya melewati guard startup. Opsi ini tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi nyata Anda ada dan menyertakan `gateway.mode="local"` saat Anda menginginkan startup gateway lokal normal.

Verifikasi bahwa konfigurasi ada:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Menulis konfigurasi melalui SSH

Perintah `fly ssh console -C` tidak mendukung shell redirection. Untuk menulis file konfigurasi:

```bash
# Gunakan echo + tee (pipe dari lokal ke remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Atau gunakan sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Catatan:** `fly sftp` dapat gagal jika file sudah ada. Hapus dulu:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Status tidak persisten

Jika Anda kehilangan profil auth, status saluran/provider, atau sesi setelah restart,
berarti state dir menulis ke filesystem kontainer.

**Perbaikan:** Pastikan `OPENCLAW_STATE_DIR=/data` diset di `fly.toml` lalu deploy ulang.

## Pembaruan

```bash
# Tarik perubahan terbaru
git pull

# Deploy ulang
fly deploy

# Periksa health
fly status
fly logs
```

### Memperbarui perintah mesin

Jika Anda perlu mengubah perintah startup tanpa deploy ulang penuh:

```bash
# Dapatkan ID mesin
fly machines list

# Perbarui perintah
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Atau dengan peningkatan memori
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Catatan:** Setelah `fly deploy`, perintah mesin dapat di-reset ke yang ada di `fly.toml`. Jika Anda membuat perubahan manual, terapkan ulang setelah deploy.

## Deployment Privat (Diperkeras)

Secara default, Fly mengalokasikan IP publik, sehingga gateway Anda dapat diakses di `https://your-app.fly.dev`. Ini praktis tetapi berarti deployment Anda dapat ditemukan oleh pemindai internet (Shodan, Censys, dll.).

Untuk deployment yang diperkeras dengan **tanpa paparan publik**, gunakan templat privat.

### Kapan menggunakan deployment privat

- Anda hanya membuat panggilan/pesan **keluar** (tanpa Webhook masuk)
- Anda menggunakan tunnel **ngrok atau Tailscale** untuk callback Webhook
- Anda mengakses gateway melalui **SSH, proxy, atau WireGuard** alih-alih browser
- Anda ingin deployment **tersembunyi dari pemindai internet**

### Penyiapan

Gunakan `fly.private.toml` alih-alih konfigurasi standar:

```bash
# Deploy dengan konfigurasi privat
fly deploy -c fly.private.toml
```

Atau ubah deployment yang ada:

```bash
# Daftar IP saat ini
fly ips list -a my-openclaw

# Lepaskan IP publik
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Beralih ke konfigurasi privat agar deploy berikutnya tidak mengalokasikan ulang IP publik
# (hapus [http_service] atau deploy dengan templat privat)
fly deploy -c fly.private.toml

# Alokasikan IPv6 privat saja
fly ips allocate-v6 --private -a my-openclaw
```

Setelah ini, `fly ips list` seharusnya hanya menampilkan IP bertipe `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Mengakses deployment privat

Karena tidak ada URL publik, gunakan salah satu metode berikut:

**Opsi 1: Proxy lokal (paling sederhana)**

```bash
# Teruskan port lokal 3000 ke app
fly proxy 3000:3000 -a my-openclaw

# Lalu buka http://localhost:3000 di browser
```

**Opsi 2: VPN WireGuard**

```bash
# Buat konfigurasi WireGuard (sekali saja)
fly wireguard create

# Impor ke klien WireGuard, lalu akses melalui IPv6 internal
# Contoh: http://[fdaa:x:x:x:x::x]:3000
```

**Opsi 3: Hanya SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook dengan deployment privat

Jika Anda memerlukan callback Webhook (Twilio, Telnyx, dll.) tanpa paparan publik:

1. **Tunnel ngrok** - Jalankan ngrok di dalam kontainer atau sebagai sidecar
2. **Tailscale Funnel** - Ekspos path tertentu melalui Tailscale
3. **Hanya keluar** - Beberapa provider (Twilio) berfungsi baik untuk panggilan keluar tanpa Webhook

Contoh konfigurasi voice-call dengan ngrok:

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

Tunnel ngrok berjalan di dalam kontainer dan menyediakan URL Webhook publik tanpa mengekspos app Fly itu sendiri. Set `webhookSecurity.allowedHosts` ke hostname tunnel publik agar forwarded host header diterima.

### Manfaat keamanan

| Aspek             | Publik       | Privat     |
| ----------------- | ------------ | ---------- |
| Pemindai internet | Dapat ditemukan | Tersembunyi |
| Serangan langsung | Mungkin      | Diblokir   |
| Akses UI Kontrol  | Browser      | Proxy/VPN  |
| Pengiriman Webhook | Langsung    | Melalui tunnel |

## Catatan

- Fly.io menggunakan **arsitektur x86** (bukan ARM)
- Dockerfile kompatibel dengan kedua arsitektur
- Untuk onboarding WhatsApp/Telegram, gunakan `fly ssh console`
- Data persisten berada di volume pada `/data`
- Signal memerlukan Java + signal-cli; gunakan image kustom dan pertahankan memori di 2GB+.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2GB):

- ~$10-15/bulan tergantung penggunaan
- Tier gratis mencakup beberapa alokasi

Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk detail.

## Langkah selanjutnya

- Siapkan saluran pesan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Jaga OpenClaw tetap mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ringkasan instalasi](/id/install)
- [Hetzner](/id/install/hetzner)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
