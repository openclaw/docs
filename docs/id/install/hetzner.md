---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di VPS awan (bukan di laptop Anda)
    - Anda menginginkan Gateway kelas produksi yang selalu aktif di VPS Anda sendiri
    - Anda menginginkan kendali penuh atas persistensi, biner, dan perilaku mulai ulang
    - Anda menjalankan OpenClaw di Docker pada Hetzner atau penyedia serupa
summary: Jalankan OpenClaw Gateway 24/7 di VPS Hetzner murah (Docker) dengan keadaan persisten dan biner yang sudah disertakan
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:17:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw di Hetzner (Docker, Panduan VPS Produksi)

## Tujuan

Jalankan OpenClaw Gateway persisten di VPS Hetzner menggunakan Docker, dengan status tahan lama, biner yang sudah disertakan, dan perilaku mulai ulang yang aman.

Jika Anda menginginkan "OpenClaw 24/7 seharga ~$5", ini adalah penyiapan andal yang paling sederhana.
Harga Hetzner berubah; pilih VPS Debian/Ubuntu terkecil dan tingkatkan kapasitas jika Anda mengalami OOM.

Pengingat model keamanan:

- Agen yang dibagikan di perusahaan aman jika semua orang berada dalam batas kepercayaan yang sama dan lingkungan eksekusinya hanya untuk bisnis.
- Pertahankan pemisahan yang ketat: VPS/lingkungan eksekusi khusus + akun khusus; jangan gunakan profil Apple/Google/browser/pengelola kata sandi pribadi di host tersebut.
- Jika pengguna saling berlawanan kepentingan, pisahkan berdasarkan gateway/host/pengguna OS.

Lihat [Keamanan](/id/gateway/security) dan [Hosting VPS](/id/vps).

## Apa yang kita lakukan (secara sederhana)?

- Menyewa server Linux kecil (VPS Hetzner)
- Menginstal Docker (lingkungan eksekusi aplikasi yang terisolasi)
- Memulai OpenClaw Gateway di Docker
- Menyimpan `~/.openclaw` + `~/.openclaw/workspace` secara persisten di host (tetap ada setelah mulai ulang/rebuild)
- Mengakses Control UI dari laptop Anda melalui tunnel SSH

Status `~/.openclaw` yang di-mount tersebut mencakup `openclaw.json`, per agen
`agents/<agentId>/agent/auth-profiles.json`, dan `.env`.

Gateway dapat diakses melalui:

- Penerusan port SSH dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini mengasumsikan Ubuntu atau Debian di Hetzner.  
Jika Anda menggunakan VPS Linux lain, sesuaikan paketnya.
Untuk alur Docker generik, lihat [Docker](/id/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Sediakan VPS Hetzner
2. Instal Docker
3. Klon repositori OpenClaw
4. Buat direktori host persisten
5. Konfigurasikan `.env` dan `docker-compose.yml`
6. Sertakan biner yang diperlukan ke dalam image
7. `docker compose up -d`
8. Verifikasi persistensi dan akses Gateway

---

## Yang Anda butuhkan

- VPS Hetzner dengan akses root
- Akses SSH dari laptop Anda
- Kenyamanan dasar dengan SSH + salin/tempel
- ~20 menit
- Docker dan Docker Compose
- Kredensial autentikasi model
- Kredensial penyedia opsional
  - QR WhatsApp
  - Token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Sediakan VPS">
    Buat VPS Ubuntu atau Debian di Hetzner.

    Hubungkan sebagai root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Panduan ini mengasumsikan VPS bersifat stateful.
    Jangan memperlakukannya sebagai infrastruktur sekali pakai.

  </Step>

  <Step title="Instal Docker (di VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Verifikasi:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Klon repositori OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Panduan ini mengasumsikan Anda akan membangun image khusus untuk menjamin persistensi biner.

  </Step>

  <Step title="Buat direktori host persisten">
    Kontainer Docker bersifat sementara.
    Semua status jangka panjang harus berada di host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Konfigurasikan variabel lingkungan">
    Buat `.env` di root repositori.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Biarkan `OPENCLAW_GATEWAY_TOKEN` kosong kecuali Anda secara eksplisit ingin
    mengelolanya melalui `.env`; OpenClaw menulis token gateway acak ke
    konfigurasi saat pertama kali dimulai. Buat kata sandi keyring dan tempelkan ke
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini untuk env kontainer/lingkungan eksekusi seperti `OPENCLAW_GATEWAY_TOKEN`.
    Autentikasi OAuth/API-key penyedia yang disimpan berada di
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` yang di-mount.

  </Step>

  <Step title="Konfigurasi Docker Compose">
    Buat atau perbarui `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` hanya untuk kemudahan bootstrap, bukan pengganti konfigurasi gateway yang benar. Tetap atur autentikasi (`gateway.auth.token` atau kata sandi) dan gunakan pengaturan bind yang aman untuk deployment Anda.

  </Step>

  <Step title="Langkah lingkungan eksekusi VM Docker bersama">
    Gunakan panduan lingkungan eksekusi bersama untuk alur host Docker yang umum:

    - [Sertakan biner yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bangun dan luncurkan](/id/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten di mana](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Akses khusus Hetzner">
    Setelah langkah build dan peluncuran bersama, selesaikan penyiapan berikut untuk membuka tunnel:

    **Prasyarat:** Pastikan konfigurasi sshd VPS Anda mengizinkan penerusan TCP. Jika Anda
    telah memperketat konfigurasi SSH, periksa `/etc/ssh/sshd_config` dan atur:

    ```
    AllowTcpForwarding local
    ```

    `local` mengizinkan penerusan lokal `ssh -L` dari laptop Anda sambil memblokir
    penerusan jarak jauh dari server. Mengaturnya ke `no` akan membuat tunnel
    gagal dengan:
    `channel 3: open failed: administratively prohibited: open failed`

    Setelah mengonfirmasi penerusan TCP diaktifkan, mulai ulang layanan SSH
    (`systemctl restart ssh`) dan jalankan tunnel dari laptop Anda:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Buka:

    `http://127.0.0.1:18789/`

    Tempelkan rahasia bersama yang dikonfigurasi. Panduan ini menggunakan token gateway secara
    default; jika Anda beralih ke autentikasi kata sandi, gunakan kata sandi tersebut.

  </Step>
</Steps>

Peta persistensi bersama berada di [Lingkungan Eksekusi VM Docker](/id/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Untuk tim yang lebih memilih alur kerja infrastructure-as-code, penyiapan Terraform yang dikelola komunitas menyediakan:

- Konfigurasi Terraform modular dengan pengelolaan state jarak jauh
- Penyediaan otomatis melalui cloud-init
- Skrip deployment (bootstrap, deploy, backup/restore)
- Pengerasan keamanan (firewall, UFW, akses hanya SSH)
- Konfigurasi tunnel SSH untuk akses gateway

**Repositori:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfigurasi Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Pendekatan ini melengkapi penyiapan Docker di atas dengan deployment yang dapat direproduksi, infrastruktur yang dikontrol versi, dan pemulihan bencana otomatis.

<Note>
Dikelola komunitas. Untuk masalah atau kontribusi, lihat tautan repositori di atas.
</Note>

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Pastikan OpenClaw tetap terbaru: [Memperbarui](/id/install/updating)

## Terkait

- [Ringkasan instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
