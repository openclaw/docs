---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di cloud VPS (bukan laptop Anda)
    - Anda menginginkan Gateway production-grade yang selalu aktif di VPS Anda sendiri
    - Anda menginginkan kontrol penuh atas persistensi, biner, dan perilaku restart
    - Anda menjalankan OpenClaw di Docker pada Hetzner atau penyedia serupa
summary: Jalankan OpenClaw Gateway 24/7 di VPS Hetzner murah (Docker) dengan state yang tahan lama dan biner yang sudah tertanam
title: Hetzner
x-i18n:
    generated_at: "2026-04-05T13:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d859e4c0943040b022835f320708f879a11eadef70f2816cf0f2824eaaf165ef
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw di Hetzner (Docker, Panduan VPS Produksi)

## Tujuan

Jalankan OpenClaw Gateway persisten di VPS Hetzner menggunakan Docker, dengan state yang tahan lama, biner yang sudah tertanam, dan perilaku restart yang aman.

Jika Anda menginginkan “OpenClaw 24/7 seharga ~$5”, ini adalah setup andal yang paling sederhana.
Harga Hetzner berubah-ubah; pilih VPS Debian/Ubuntu terkecil dan naikkan skala jika Anda mengalami OOM.

Pengingat model keamanan:

- Agen bersama untuk perusahaan tetap aman saat semua orang berada dalam trust boundary yang sama dan runtime hanya untuk bisnis.
- Pertahankan pemisahan ketat: VPS/runtime khusus + akun khusus; jangan gunakan profil Apple/Google/browser/password manager pribadi di host tersebut.
- Jika pengguna saling adversarial, pisahkan per gateway/host/pengguna OS.

Lihat [Security](/gateway/security) dan [VPS hosting](/vps).

## Apa yang kita lakukan (secara sederhana)?

- Menyewa server Linux kecil (VPS Hetzner)
- Menginstal Docker (runtime aplikasi terisolasi)
- Menjalankan OpenClaw Gateway di Docker
- Menyimpan `~/.openclaw` + `~/.openclaw/workspace` di host (tetap ada setelah restart/rebuild)
- Mengakses UI Kontrol dari laptop Anda melalui tunnel SSH

State `~/.openclaw` yang di-mount tersebut mencakup `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`
per agen, dan `.env`.

Gateway dapat diakses melalui:

- Port forwarding SSH dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini mengasumsikan Ubuntu atau Debian di Hetzner.  
Jika Anda menggunakan Linux VPS lain, sesuaikan paketnya.
Untuk alur Docker umum, lihat [Docker](/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Provision VPS Hetzner
2. Instal Docker
3. Clone repositori OpenClaw
4. Buat direktori host persisten
5. Konfigurasikan `.env` dan `docker-compose.yml`
6. Tertanamkan biner yang diperlukan ke dalam image
7. `docker compose up -d`
8. Verifikasi persistensi dan akses Gateway

---

## Yang Anda butuhkan

- VPS Hetzner dengan akses root
- Akses SSH dari laptop Anda
- Pemahaman dasar tentang SSH + copy/paste
- ~20 menit
- Docker dan Docker Compose
- Kredensial auth model
- Kredensial penyedia opsional
  - QR WhatsApp
  - token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provision VPS">
    Buat VPS Ubuntu atau Debian di Hetzner.

    Hubungkan sebagai root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Panduan ini mengasumsikan VPS bersifat stateful.
    Jangan perlakukan sebagai infrastruktur sekali pakai.

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

  <Step title="Clone repositori OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Panduan ini mengasumsikan Anda akan membangun image kustom untuk menjamin persistensi biner.

  </Step>

  <Step title="Buat direktori host persisten">
    Container Docker bersifat ephemeral.
    Semua state jangka panjang harus berada di host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Atur kepemilikan ke pengguna container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Konfigurasikan variabel lingkungan">
    Buat `.env` di root repositori.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Buat secret yang kuat:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini untuk env container/runtime seperti `OPENCLAW_GATEWAY_TOKEN`.
    Auth OAuth/API key penyedia yang disimpan berada di
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
          # Direkomendasikan: pertahankan Gateway hanya loopback di VPS; akses melalui tunnel SSH.
          # Untuk mengeksposnya secara publik, hapus prefiks `127.0.0.1:` dan atur firewall sesuai kebutuhan.
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

    `--allow-unconfigured` hanya untuk kemudahan bootstrap, bukan pengganti konfigurasi gateway yang benar. Tetap setel auth (`gateway.auth.token` atau password) dan gunakan pengaturan bind yang aman untuk deployment Anda.

  </Step>

  <Step title="Langkah runtime Docker VM bersama">
    Gunakan panduan runtime bersama untuk alur host Docker umum:

    - [Tertanamkan biner yang diperlukan ke dalam image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build dan jalankan](/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten di mana](/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Akses khusus Hetzner">
    Setelah langkah build dan launch bersama selesai, buat tunnel dari laptop Anda:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Buka:

    `http://127.0.0.1:18789/`

    Tempelkan shared secret yang dikonfigurasi. Panduan ini menggunakan token gateway
    secara default; jika Anda beralih ke auth password, gunakan password tersebut.

  </Step>
</Steps>

Peta persistensi bersama ada di [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Untuk tim yang lebih memilih alur infrastructure-as-code, setup Terraform yang dikelola komunitas menyediakan:

- Konfigurasi Terraform modular dengan manajemen remote state
- Provisioning otomatis melalui cloud-init
- Skrip deployment (bootstrap, deploy, backup/restore)
- Hardening keamanan (firewall, UFW, akses SSH saja)
- Konfigurasi tunnel SSH untuk akses gateway

**Repositori:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfigurasi Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Pendekatan ini melengkapi setup Docker di atas dengan deployment yang dapat direproduksi, infrastruktur yang dikendalikan versi, dan pemulihan bencana otomatis.

> **Catatan:** Dikelola oleh komunitas. Untuk masalah atau kontribusi, lihat tautan repositori di atas.

## Langkah berikutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi gateway](/id/gateway/configuration)
- Selalu perbarui OpenClaw: [Updating](/install/updating)
