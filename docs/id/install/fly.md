---
read_when:
    - Menerapkan OpenClaw di Fly.io
    - Menyiapkan volume Fly, rahasia, dan konfigurasi proses pertama kali dijalankan
summary: Penerapan OpenClaw di Fly.io langkah demi langkah dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T18:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Tujuan:** Gateway OpenClaw berjalan pada mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, dan akses Discord/saluran.

## Yang Anda perlukan

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) terinstal
- Akun Fly.io (tingkat gratis dapat digunakan)
- Autentikasi model: kunci API untuk penyedia model yang Anda pilih
- Kredensial saluran: token bot Discord, token Telegram, dan sebagainya.

## Jalur cepat untuk pemula

1. Kloning repositori, sesuaikan `fly.toml`
2. Buat aplikasi + volume, atur rahasia
3. Deploy dengan `fly deploy`
4. Masuk melalui SSH untuk membuat konfigurasi, atau gunakan UI Kontrol

<Steps>
  <Step title="Buat aplikasi Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pilih nama Anda sendiri
    fly apps create my-openclaw

    # 1GB biasanya cukup
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Pilih wilayah yang dekat dengan Anda. Opsi umum: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Konfigurasikan fly.toml">
    Edit `fly.toml` agar sesuai dengan nama aplikasi dan kebutuhan Anda. `fly.toml` yang dilacak dalam repositori adalah templat publik yang ditampilkan di bawah; `deploy/fly.private.toml` adalah varian yang diperketat tanpa IP publik (lihat [Deployment privat](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nama aplikasi Anda
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

    Titik masuk image Docker OpenClaw adalah `tini`, yang secara default menjalankan `node openclaw.mjs gateway`. `[processes]` Fly menggantikan `CMD` Docker (di sini menjalankan `node dist/index.js gateway ...` secara langsung, titik masuk terkompilasi yang sama) tanpa mengubah `ENTRYPOINT`, sehingga proses tetap berjalan sebagai `tini`.

    **Pengaturan utama:**

    | Pengaturan                     | Alasan                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Mengikat ke `0.0.0.0` agar proksi Fly dapat menjangkau gateway              |
    | `--allow-unconfigured`         | Memulai tanpa berkas konfigurasi (Anda membuatnya setelah itu)             |
    | `internal_port = 3000`         | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk pemeriksaan kesehatan Fly |
    | `memory = "2048mb"`            | 512MB terlalu kecil; 2GB direkomendasikan                                   |
    | `OPENCLAW_STATE_DIR = "/data"` | Mempertahankan status pada volume                                           |

  </Step>

  <Step title="Atur rahasia">
    ```bash
    # wajib: token autentikasi gateway untuk pengikatan non-loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # kunci API penyedia model
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opsional: penyedia lain
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token saluran
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Pengikatan non-loopback (`--bind lan`) memerlukan jalur autentikasi gateway yang valid. Contoh ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau deployment proksi tepercaya non-loopback yang dikonfigurasi dengan benar juga memenuhi persyaratan. Lihat [Pengelolaan rahasia](/id/gateway/secrets) untuk kontrak SecretRef.

    Perlakukan token-token ini seperti kata sandi. Utamakan variabel lingkungan/`fly secrets` daripada berkas konfigurasi untuk kunci API dan token agar rahasia tidak masuk ke `openclaw.json`.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Deployment pertama membangun image Docker. Verifikasi setelah deployment:

    ```bash
    fly status
    fly logs
    ```

    Log startup Gateway mencatat `gateway ready` setelah listener HTTP/WebSocket aktif. Pemeriksaan kesehatan Fly sendiri memantau `internal_port = 3000` sesuai `fly.toml`; direktif `HEALTHCHECK` Docker pada image juga melakukan polling terhadap `/healthz` di port default 18789, yang tidak digunakan di sini karena deployment ini mengganti gateway menjadi `--port 3000`.

  </Step>

  <Step title="Buat berkas konfigurasi">
    Masuk ke mesin melalui SSH untuk membuat konfigurasi yang tepat:

    ```bash
    fly ssh console
    ```

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

    Dengan `OPENCLAW_STATE_DIR=/data`, jalur konfigurasi adalah `/data/openclaw.json`.

    Ganti `https://my-openclaw.fly.dev` dengan origin aplikasi Fly Anda yang sebenarnya. Startup Gateway mengisi origin UI Kontrol lokal dari nilai runtime `--bind` dan `--port` agar boot pertama dapat dilanjutkan sebelum konfigurasi tersedia, tetapi akses browser melalui Fly tetap memerlukan origin HTTPS persis yang tercantum dalam `gateway.controlUi.allowedOrigins`.

    Token Discord dapat berasal dari salah satu sumber berikut:

    - Variabel lingkungan `DISCORD_BOT_TOKEN` (direkomendasikan untuk rahasia); tidak perlu menambahkannya ke konfigurasi, gateway membacanya secara otomatis
    - Berkas konfigurasi `channels.discord.token`

    Mulai ulang untuk menerapkan:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Akses Gateway">
    ### UI Kontrol

    ```bash
    fly open
    ```

    Atau kunjungi `https://my-openclaw.fly.dev/`.

    Lakukan autentikasi dengan rahasia bersama yang dikonfigurasi: token gateway dari `OPENCLAW_GATEWAY_TOKEN`, atau kata sandi Anda jika Anda beralih ke autentikasi kata sandi.

    ### Log

    ```bash
    fly logs              # log langsung
    fly logs --no-tail    # log terbaru
    ```

    ### Konsol SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Pemecahan masalah

### "Aplikasi tidak mendengarkan pada alamat yang diharapkan"

Gateway terikat ke `127.0.0.1`, bukan `0.0.0.0`.

**Perbaikan:** tambahkan `--bind lan` ke perintah proses Anda dalam `fly.toml`.

### Pemeriksaan kesehatan gagal / koneksi ditolak

Fly tidak dapat menjangkau gateway pada port yang dikonfigurasi.

**Perbaikan:** pastikan `internal_port` cocok dengan port gateway (`--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### Masalah OOM / memori

Kontainer terus dimulai ulang atau dihentikan. Tandanya: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau mulai ulang tanpa pesan.

**Perbaikan:** tingkatkan memori dalam `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang sudah ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB terlalu kecil. 1GB mungkin dapat digunakan, tetapi bisa mengalami OOM saat beban tinggi atau dengan pencatatan log mendetail. 2GB direkomendasikan.

### Masalah kunci Gateway

Gateway menolak dimulai dengan galat "sudah berjalan" setelah kontainer dimulai ulang.

Berkas kunci runtime berada di `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
dan `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), bukan pada volume persisten `/data`, sehingga
mulai ulang kontainer secara penuh biasanya menghapusnya bersama seluruh
sistem berkas kontainer lainnya. Jika kunci tetap ada (misalnya `fly machine restart`
yang mempertahankan sistem berkas kontainer) dan menghalangi startup, hapus
secara manual:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Konfigurasi tidak dibaca

`--allow-unconfigured` hanya melewati pengaman startup. Opsi ini tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi Anda yang sebenarnya tersedia dan menyertakan `"gateway": { "mode": "local" }` untuk startup gateway lokal normal.

Verifikasi bahwa konfigurasi tersedia:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Menulis konfigurasi melalui SSH

`fly ssh console -C` tidak mendukung pengalihan shell. Untuk menulis berkas konfigurasi:

```bash
# echo + tee (salurkan dari lokal ke jarak jauh)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# atau sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` mungkin gagal jika berkas sudah tersedia; hapus terlebih dahulu:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Status tidak dipertahankan

Jika profil autentikasi, status saluran/penyedia, atau sesi hilang setelah mulai ulang, direktori status ditulis ke sistem berkas kontainer, bukan ke volume.

**Perbaikan:** pastikan `OPENCLAW_STATE_DIR=/data` diatur dalam `fly.toml`, lalu deploy ulang.

## Memperbarui

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` adalah jalur yang diawasi di sini: jalur ini membangun ulang image dari Dockerfile, sehingga versi CLI/gateway, image OS dasar, dan semua perubahan Dockerfile diperbarui bersama-sama. `openclaw update` di dalam kontainer yang sedang berjalan bukanlah operasi yang sama karena image dikirim sebagai struktur `dist/` yang dibangun dengan Docker tanpa checkout `.git` dan tanpa instalasi global yang dikelola npm untuk dideteksi; lihat [Memperbarui](/id/install/updating) untuk alur tersebut pada instalasi bergaya VM.

### Memperbarui perintah mesin

Untuk mengubah perintah startup tanpa deployment ulang penuh:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# atau dengan peningkatan memori
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

`fly deploy` berikutnya mengatur ulang perintah mesin ke apa pun yang ada dalam `fly.toml`; terapkan kembali perubahan manual setelah melakukan deployment ulang.

## Deployment privat (diperketat)

Secara default, Fly mengalokasikan IP publik sehingga gateway Anda dapat dijangkau di `https://your-app.fly.dev` dan ditemukan oleh pemindai internet (Shodan, Censys, dan sebagainya).

Gunakan `deploy/fly.private.toml` untuk deployment yang diperketat dengan **tanpa IP publik**: konfigurasi ini tidak menyertakan `[http_service]`, sehingga tidak ada ingress publik yang dialokasikan.

### Kapan menggunakan deployment privat

- Hanya panggilan/pesan keluar (tanpa webhook masuk)
- Terowongan ngrok atau Tailscale menangani semua panggilan balik webhook
- Gateway diakses melalui SSH, proksi, atau WireGuard, bukan melalui browser
- Deployment harus disembunyikan dari pemindai internet

### Penyiapan

```bash
fly deploy -c deploy/fly.private.toml
```

Atau konversikan deployment yang sudah ada:

```bash
# tampilkan IP saat ini
fly ips list -a my-openclaw

# lepaskan IP publik
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# beralih ke konfigurasi privat agar deployment mendatang tidak mengalokasikan ulang IP publik
fly deploy -c deploy/fly.private.toml

# alokasikan IPv6 khusus privat
fly ips allocate-v6 --private -a my-openclaw
```

Setelah ini, `fly ips list` seharusnya hanya menampilkan IP bertipe `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Mengakses deployment privat

**Opsi 1: proksi lokal (paling sederhana)**

```bash
fly proxy 3000:3000 -a my-openclaw
# buka http://localhost:3000 di peramban
```

**Opsi 2: VPN WireGuard**

```bash
fly wireguard create
# impor ke klien WireGuard, lalu akses melalui IPv6 internal
# contoh: http://[fdaa:x:x:x:x::x]:3000
```

**Opsi 3: hanya SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook dengan deployment privat

Untuk callback Webhook (Twilio, Telnyx, dan sebagainya) tanpa paparan publik:

1. **tunnel ngrok**: jalankan ngrok di dalam kontainer, atau sebagai sidecar
2. **Tailscale Funnel**: ekspos path tertentu melalui Tailscale
3. **Hanya keluar**: beberapa penyedia (Twilio) berfungsi untuk panggilan keluar tanpa Webhook

Contoh konfigurasi panggilan suara dengan ngrok, di bawah `plugins.entries.voice-call.config`:

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

Tunnel ngrok berjalan di dalam kontainer dan menyediakan URL Webhook publik tanpa mengekspos aplikasi Fly itu sendiri. Atur `webhookSecurity.allowedHosts` ke nama host tunnel agar header host yang diteruskan dapat diterima.

### Pertimbangan keamanan

| Aspek             | Publik       | Privat             |
| ----------------- | ------------ | ------------------ |
| Pemindai internet | Dapat ditemukan | Tersembunyi     |
| Serangan langsung | Mungkin      | Diblokir           |
| Akses UI kontrol  | Peramban     | Proksi/VPN          |
| Pengiriman Webhook | Langsung    | Melalui tunnel      |

## Catatan

- Fly.io menggunakan arsitektur x86; Dockerfile kompatibel dengan x86 dan ARM.
- Untuk orientasi WhatsApp/Telegram, gunakan `fly ssh console`.
- Data persisten berada pada volume di `/data`.
- Signal memerlukan signal-cli (CLI berbasis Java) pada image; gunakan image khusus dan pertahankan memori sebesar 2GB+.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2GB), perkirakan biaya sekitar $10-15/bulan tergantung penggunaan; tingkat gratis mencakup sebagian alokasi dasar. Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk tarif saat ini.

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw tetap mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Hetzner](/id/install/hetzner)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
