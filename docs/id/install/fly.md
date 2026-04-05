---
read_when:
    - Men-deploy OpenClaw di Fly.io
    - Menyiapkan volume, secret, dan konfigurasi saat pertama kali dijalankan di Fly
summary: Deployment Fly.io langkah demi langkah untuk OpenClaw dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T13:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Deployment Fly.io

**Tujuan:** Gateway OpenClaw berjalan di mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, dan akses Discord/channel.

## Yang Anda butuhkan

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) sudah terinstal
- Akun Fly.io (tier gratis bisa digunakan)
- Auth model: kunci API untuk provider model pilihan Anda
- Kredensial channel: token bot Discord, token Telegram, dll.

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
    Edit `fly.toml` agar sesuai dengan nama app dan kebutuhan Anda.

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

    | Setting                        | Mengapa                                                                    |
    | ------------------------------ | -------------------------------------------------------------------------- |
    | `--bind lan`                   | Melakukan bind ke `0.0.0.0` agar proxy Fly dapat menjangkau gateway        |
    | `--allow-unconfigured`         | Memulai tanpa file konfigurasi (Anda akan membuatnya nanti)                |
    | `internal_port = 3000`         | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk health check Fly |
    | `memory = "2048mb"`            | 512MB terlalu kecil; disarankan 2GB                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | Menyimpan state secara persisten di volume                                 |

  </Step>

  <Step title="Set secret">
    ```bash
    # Wajib: token Gateway (untuk bind non-loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Kunci API provider model
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Opsional: provider lain
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Token channel
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Catatan:**

    - Bind non-loopback (`--bind lan`) memerlukan jalur auth gateway yang valid. Contoh Fly.io ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau deployment `trusted-proxy` non-loopback yang dikonfigurasi dengan benar juga memenuhi syarat tersebut.
    - Perlakukan token ini seperti kata sandi.
    - **Utamakan env var daripada file konfigurasi** untuk semua kunci API dan token. Ini menjaga secret tetap di luar `openclaw.json` agar tidak terekspos atau tercatat secara tidak sengaja.

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
    SSH ke mesin untuk membuat konfigurasi yang sesuai:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Catatan:** Dengan `OPENCLAW_STATE_DIR=/data`, path konfigurasi adalah `/data/openclaw.json`.

    **Catatan:** Token Discord dapat berasal dari salah satu sumber berikut:

    - Variabel lingkungan: `DISCORD_BOT_TOKEN` (disarankan untuk secret)
    - File konfigurasi: `channels.discord.token`

    Jika menggunakan env var, tidak perlu menambahkan token ke konfigurasi. Gateway membaca `DISCORD_BOT_TOKEN` secara otomatis.

    Restart agar diterapkan:

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

    Lakukan autentikasi dengan secret bersama yang telah dikonfigurasi. Panduan ini menggunakan token gateway
    dari `OPENCLAW_GATEWAY_TOKEN`; jika Anda beralih ke auth berbasis kata sandi, gunakan
    kata sandi tersebut.

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

Gateway melakukan bind ke `127.0.0.1` alih-alih `0.0.0.0`.

**Perbaikan:** Tambahkan `--bind lan` ke perintah process Anda di `fly.toml`.

### Health check gagal / connection refused

Fly tidak dapat menjangkau gateway di port yang dikonfigurasi.

**Perbaikan:** Pastikan `internal_port` cocok dengan port gateway (set `--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Masalah memori

Kontainer terus restart atau dihentikan. Tanda-tandanya: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau restart diam-diam.

**Perbaikan:** Tingkatkan memori di `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang sudah ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Catatan:** 512MB terlalu kecil. 1GB mungkin bisa berjalan tetapi dapat mengalami OOM saat ada beban atau logging verbose. **2GB direkomendasikan.**

### Masalah lock Gateway

Gateway menolak untuk mulai dengan error "already running".

Ini terjadi saat kontainer restart tetapi file lock PID tetap ada di volume.

**Perbaikan:** Hapus file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

File lock berada di `/data/gateway.*.lock` (bukan di subdirektori).

### Konfigurasi tidak terbaca

`--allow-unconfigured` hanya melewati guard saat startup. Itu tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi nyata Anda ada dan menyertakan `gateway.mode="local"` saat Anda menginginkan gateway lokal normal untuk dijalankan.

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

**Catatan:** `fly sftp` mungkin gagal jika file sudah ada. Hapus dulu:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### State tidak persisten

Jika Anda kehilangan profil auth, state channel/provider, atau sesi setelah restart,
direktori state sedang ditulis ke filesystem kontainer.

**Perbaikan:** Pastikan `OPENCLAW_STATE_DIR=/data` disetel di `fly.toml` lalu deploy ulang.

## Pembaruan

```bash
# Ambil perubahan terbaru
git pull

# Deploy ulang
fly deploy

# Periksa kesehatan
fly status
fly logs
```

### Memperbarui perintah mesin

Jika Anda perlu mengubah perintah startup tanpa deploy ulang penuh:

```bash
# Dapatkan machine ID
fly machines list

# Perbarui perintah
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Atau dengan penambahan memori
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Catatan:** Setelah `fly deploy`, perintah mesin dapat di-reset ke yang ada di `fly.toml`. Jika Anda membuat perubahan manual, terapkan kembali setelah deploy.

## Deployment Privat (Diperkeras)

Secara default, Fly mengalokasikan IP publik, sehingga gateway Anda dapat diakses di `https://your-app.fly.dev`. Ini nyaman, tetapi berarti deployment Anda dapat ditemukan oleh pemindai internet (Shodan, Censys, dll.).

Untuk deployment yang diperkeras dengan **tanpa paparan publik**, gunakan template privat.

### Kapan menggunakan deployment privat

- Anda hanya melakukan panggilan/pesan **keluar** (tanpa webhook masuk)
- Anda menggunakan tunnel **ngrok atau Tailscale** untuk callback webhook apa pun
- Anda mengakses gateway melalui **SSH, proxy, atau WireGuard** alih-alih browser
- Anda ingin deployment **tersembunyi dari pemindai internet**

### Penyiapan

Gunakan `fly.private.toml` alih-alih konfigurasi standar:

```bash
# Deploy dengan konfigurasi privat
fly deploy -c fly.private.toml
```

Atau ubah deployment yang sudah ada:

```bash
# Daftar IP saat ini
fly ips list -a my-openclaw

# Lepaskan IP publik
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Beralih ke konfigurasi privat agar deploy berikutnya tidak mengalokasikan ulang IP publik
# (hapus [http_service] atau deploy dengan template privat)
fly deploy -c fly.private.toml

# Alokasikan IPv6 khusus privat
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

**Opsi 3: SSH saja**

```bash
fly ssh console -a my-openclaw
```

### Webhook dengan deployment privat

Jika Anda memerlukan callback webhook (Twilio, Telnyx, dll.) tanpa paparan publik:

1. **Tunnel ngrok** - Jalankan ngrok di dalam kontainer atau sebagai sidecar
2. **Tailscale Funnel** - Ekspos path tertentu melalui Tailscale
3. **Hanya outbound** - Beberapa provider (Twilio) berfungsi baik untuk panggilan keluar tanpa webhook

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

Tunnel ngrok berjalan di dalam kontainer dan menyediakan URL webhook publik tanpa mengekspos app Fly itu sendiri. Set `webhookSecurity.allowedHosts` ke hostname tunnel publik agar header host yang diteruskan dapat diterima.

### Manfaat keamanan

| Aspect            | Publik       | Privat     |
| ----------------- | ------------ | ---------- |
| Pemindai internet | Dapat ditemukan | Tersembunyi |
| Serangan langsung | Mungkin      | Diblokir   |
| Akses UI Kontrol  | Browser      | Proxy/VPN  |
| Pengiriman webhook| Langsung     | Via tunnel |

## Catatan

- Fly.io menggunakan **arsitektur x86** (bukan ARM)
- Dockerfile kompatibel dengan kedua arsitektur
- Untuk onboarding WhatsApp/Telegram, gunakan `fly ssh console`
- Data persisten berada di volume di `/data`
- Signal memerlukan Java + `signal-cli`; gunakan image kustom dan pertahankan memori di 2GB+.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2GB):

- ~US$10-15/bulan tergantung penggunaan
- Tier gratis mencakup sejumlah kuota

Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk detail.

## Langkah selanjutnya

- Siapkan channel perpesanan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Jaga OpenClaw tetap terbaru: [Updating](/install/updating)
