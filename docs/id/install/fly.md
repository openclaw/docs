---
read_when:
    - Menerapkan OpenClaw di Fly.io
    - Menyiapkan volume, rahasia, dan konfigurasi awal Fly
summary: Penerapan OpenClaw di Fly.io langkah demi langkah dengan penyimpanan persisten dan HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T14:17:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Tujuan:** Gateway OpenClaw berjalan pada mesin [Fly.io](https://fly.io) dengan penyimpanan persisten, HTTPS otomatis, serta akses Discord/kanal.

## Yang Anda perlukan

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) terinstal
- Akun Fly.io (tingkat gratis dapat digunakan)
- Autentikasi model: kunci API untuk penyedia model pilihan Anda
- Kredensial kanal: token bot Discord, token Telegram, dan sebagainya

## Jalur cepat untuk pemula

1. Klon repositori, sesuaikan `fly.toml`
2. Buat aplikasi + volume, tetapkan rahasia
3. Terapkan dengan `fly deploy`
4. Masuk melalui SSH untuk membuat konfigurasi, atau gunakan UI Kontrol

<Steps>
  <Step title="Buat aplikasi Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pilih nama Anda sendiri
    fly apps create my-openclaw

    # 1 GB biasanya cukup
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Pilih wilayah yang dekat dengan Anda. Opsi umum: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Konfigurasikan fly.toml">
    Edit `fly.toml` agar sesuai dengan nama aplikasi dan kebutuhan Anda. `fly.toml` yang dilacak dalam repositori adalah templat publik yang ditampilkan di bawah; `deploy/fly.private.toml` adalah varian yang diperkuat tanpa IP publik (lihat [Penerapan privat](#private-deployment-hardened)).

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

    Titik masuk citra Docker OpenClaw adalah `tini`, yang secara bawaan menjalankan `node openclaw.mjs gateway`. `[processes]` Fly menggantikan `CMD` Docker (di sini menjalankan `node dist/index.js gateway ...` secara langsung, yaitu titik masuk terkompilasi yang sama) tanpa mengubah `ENTRYPOINT`, sehingga proses tetap berjalan di bawah `tini`.

    **Pengaturan utama:**

    | Pengaturan                     | Alasan                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Mengikat ke `0.0.0.0` agar proksi Fly dapat menjangkau Gateway              |
    | `--allow-unconfigured`         | Memulai tanpa berkas konfigurasi (Anda membuatnya setelah itu)              |
    | `internal_port = 3000`         | Harus cocok dengan `--port 3000` (atau `OPENCLAW_GATEWAY_PORT`) untuk pemeriksaan kesehatan Fly |
    | `memory = "2048mb"`            | 512 MB terlalu kecil; disarankan 2 GB                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | Mempertahankan status pada volume                                           |

  </Step>

  <Step title="Tetapkan rahasia">
    ```bash
    # wajib: token autentikasi gateway untuk pengikatan non-loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # kunci API penyedia model
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opsional: penyedia lain
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token kanal
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Pengikatan non-loopback (`--bind lan`) memerlukan jalur autentikasi Gateway yang valid. Contoh ini menggunakan `OPENCLAW_GATEWAY_TOKEN`, tetapi `gateway.auth.password` atau penerapan proksi tepercaya non-loopback yang dikonfigurasi dengan benar juga memenuhi persyaratan tersebut. Lihat [Pengelolaan rahasia](/id/gateway/secrets) untuk kontrak SecretRef.

    Perlakukan token ini seperti kata sandi. Utamakan variabel lingkungan/`fly secrets` daripada berkas konfigurasi untuk kunci API dan token agar rahasia tidak tersimpan dalam `openclaw.json`.

  </Step>

  <Step title="Terapkan">
    ```bash
    fly deploy
    ```

    Penerapan pertama membangun citra Docker. Verifikasi setelah penerapan:

    ```bash
    fly status
    fly logs
    ```

    Saat pemroses HTTP/WebSocket aktif, proses awal Gateway mencatat `gateway ready`. Pemeriksaan kesehatan Fly memantau `internal_port = 3000` sesuai `fly.toml`; direktif `HEALTHCHECK` Docker pada citra juga melakukan polling terhadap `/healthz` pada porta bawaannya, 18789, yang tidak digunakan di sini karena penerapan ini mengganti Gateway agar menggunakan `--port 3000`.

  </Step>

  <Step title="Buat berkas konfigurasi">
    Masuk ke mesin melalui SSH untuk membuat konfigurasi yang sesuai:

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

    Ganti `https://my-openclaw.fly.dev` dengan origin aplikasi Fly Anda yang sebenarnya. Saat dimulai, Gateway mengisi origin lokal UI Kontrol berdasarkan nilai `--bind` dan `--port` waktu proses agar boot pertama dapat dilanjutkan sebelum konfigurasi tersedia, tetapi akses peramban melalui Fly tetap memerlukan origin HTTPS yang persis sama dalam daftar `gateway.controlUi.allowedOrigins`.

    Token Discord dapat berasal dari salah satu sumber berikut:

    - Variabel lingkungan `DISCORD_BOT_TOKEN` (disarankan untuk rahasia); tidak perlu menambahkannya ke konfigurasi karena Gateway membacanya secara otomatis
    - Berkas konfigurasi `channels.discord.token`

    Mulai ulang untuk menerapkannya:

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

    Lakukan autentikasi dengan rahasia bersama yang dikonfigurasi: token Gateway dari `OPENCLAW_GATEWAY_TOKEN`, atau kata sandi Anda jika beralih ke autentikasi kata sandi.

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

Gateway mengikat ke `127.0.0.1`, bukan ke `0.0.0.0`.

**Perbaikan:** tambahkan `--bind lan` ke perintah proses Anda dalam `fly.toml`.

### Pemeriksaan kesehatan gagal / koneksi ditolak

Fly tidak dapat menjangkau Gateway pada porta yang dikonfigurasi.

**Perbaikan:** pastikan `internal_port` cocok dengan porta Gateway (`--port 3000` atau `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / masalah memori

Kontainer terus dimulai ulang atau dihentikan secara paksa. Tandanya: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, atau mulai ulang tanpa pesan.

**Perbaikan:** tingkatkan memori dalam `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Atau perbarui mesin yang sudah ada:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB terlalu kecil. 1 GB mungkin dapat digunakan, tetapi dapat mengalami OOM ketika beban tinggi atau pencatatan log mendetail diaktifkan. Disarankan 2 GB.

### Masalah penguncian Gateway

Gateway menolak dimulai dengan galat "sudah berjalan" setelah kontainer dimulai ulang.

Berkas kunci instans tunggal berada di `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), bukan pada volume persisten `/data`, sehingga mulai ulang kontainer sepenuhnya biasanya menghapusnya bersama seluruh sistem berkas kontainer lainnya. Jika kunci tetap bertahan (misalnya setelah `fly machine restart` yang mempertahankan sistem berkas kontainer) dan menghalangi proses awal, hapus secara manual:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Konfigurasi tidak dibaca

`--allow-unconfigured` hanya melewati pengaman proses awal. Opsi tersebut tidak membuat atau memperbaiki `/data/openclaw.json`, jadi pastikan konfigurasi Anda benar-benar tersedia dan menyertakan `"gateway": { "mode": "local" }` untuk memulai Gateway lokal secara normal.

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

Jika profil autentikasi, status kanal/penyedia, atau sesi hilang setelah mulai ulang, direktori status sedang ditulis ke sistem berkas kontainer, bukan ke volume.

**Perbaikan:** pastikan `OPENCLAW_STATE_DIR=/data` ditetapkan dalam `fly.toml`, lalu terapkan ulang.

## Memperbarui

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` adalah jalur yang diawasi di sini: perintah tersebut membangun ulang citra dari Dockerfile, sehingga versi CLI/Gateway, citra sistem operasi dasar, dan setiap perubahan Dockerfile diperbarui secara bersamaan. `openclaw update` di dalam kontainer yang sedang berjalan bukan operasi yang sama karena citra dikirim sebagai pohon `dist/` hasil pembangunan Docker, tanpa salinan kerja `.git` dan tanpa instalasi global yang dikelola npm untuk dideteksi; lihat [Memperbarui](/id/install/updating) untuk alur tersebut pada instalasi bergaya VM.

### Memperbarui perintah mesin

Untuk mengubah perintah proses awal tanpa penerapan ulang penuh:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# atau dengan peningkatan memori
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

`fly deploy` berikutnya mengatur ulang perintah mesin ke nilai yang tercantum dalam `fly.toml`; terapkan kembali perubahan manual setelah penerapan ulang.

## Penerapan privat (diperkuat)

Secara bawaan, Fly mengalokasikan IP publik, sehingga Gateway Anda dapat dijangkau di `https://your-app.fly.dev` dan ditemukan oleh pemindai internet (Shodan, Censys, dan sebagainya).

Gunakan `deploy/fly.private.toml` untuk penerapan yang diperkuat dengan **tanpa IP publik**: konfigurasi ini tidak menyertakan `[http_service]`, sehingga tidak ada akses masuk publik yang dialokasikan.

### Kapan menggunakan penerapan privat

- Hanya panggilan/pesan keluar (tanpa Webhook masuk)
- Terowongan ngrok atau Tailscale menangani semua panggilan balik Webhook
- Akses Gateway dilakukan melalui SSH, proksi, atau WireGuard, bukan melalui peramban
- Penerapan harus disembunyikan dari pemindai internet

### Penyiapan

```bash
fly deploy -c deploy/fly.private.toml
```

Atau konversikan penerapan yang sudah ada:

```bash
# tampilkan IP saat ini
fly ips list -a my-openclaw

# lepaskan IP publik
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# beralih ke konfigurasi privat agar penerapan berikutnya tidak mengalokasikan ulang IP publik
fly deploy -c deploy/fly.private.toml

# alokasikan IPv6 privat saja
fly ips allocate-v6 --private -a my-openclaw
```

Setelah ini, `fly ips list` seharusnya hanya menampilkan IP berjenis `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Mengakses penerapan privat

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

### Webhook dengan penerapan privat

Untuk panggilan balik webhook (Twilio, Telnyx, dan sebagainya) tanpa mengeksposnya ke publik:

1. **Terowongan ngrok**: jalankan ngrok di dalam kontainer atau sebagai sidecar
2. **Tailscale Funnel**: ekspos jalur tertentu melalui Tailscale
3. **Hanya keluar**: beberapa penyedia (Twilio) dapat digunakan untuk panggilan keluar tanpa webhook

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

Terowongan ngrok berjalan di dalam kontainer dan menyediakan URL webhook publik tanpa mengekspos aplikasi Fly itu sendiri. Atur `webhookSecurity.allowedHosts` ke nama host terowongan agar header host yang diteruskan dapat diterima.

### Kompromi keamanan

| Aspek               | Publik               | Privat                  |
| ------------------- | -------------------- | ----------------------- |
| Pemindai internet   | Dapat ditemukan      | Tersembunyi             |
| Serangan langsung   | Mungkin terjadi      | Diblokir                |
| Akses UI kontrol    | Peramban             | Proksi/VPN              |
| Pengiriman webhook  | Langsung             | Melalui terowongan      |

## Catatan

- Fly.io menggunakan arsitektur x86; Dockerfile kompatibel dengan x86 dan ARM.
- Untuk orientasi WhatsApp/Telegram, gunakan `fly ssh console`.
- Data persisten berada di volume pada `/data`.
- Signal memerlukan signal-cli (CLI berbasis Java) di dalam citra; gunakan citra khusus dan pertahankan memori sebesar 2 GB atau lebih.

## Biaya

Dengan konfigurasi yang direkomendasikan (`shared-cpu-2x`, RAM 2 GB), perkirakan biayanya sekitar $10–15/bulan, tergantung pada penggunaan; tingkat gratis mencakup sebagian alokasi dasar. Lihat [harga Fly.io](https://fly.io/docs/about/pricing/) untuk tarif terkini.

## Langkah selanjutnya

- Siapkan kanal perpesanan: [Kanal](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw selalu mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Hetzner](/id/install/hetzner)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
