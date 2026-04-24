---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di VPS cloud (bukan laptop Anda)
    - Anda menginginkan Gateway yang selalu aktif dan siap produksi di VPS Anda sendiri
    - Anda menginginkan kontrol penuh atas persistensi, binary, dan perilaku restart
    - Anda menjalankan OpenClaw di Docker pada Hetzner atau penyedia serupa
summary: Jalankan Gateway OpenClaw 24/7 di VPS Hetzner murah (Docker) dengan state yang tahan lama dan binary yang di-bake ke dalam image
title: Hetzner
x-i18n:
    generated_at: "2026-04-24T09:13:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d5917add7afea31426ef587577af21ed18f09302cbf8e542f547a6530ff38b
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw di Hetzner (Docker, Panduan VPS Produksi)

## Tujuan

Menjalankan Gateway OpenClaw yang persisten di VPS Hetzner menggunakan Docker, dengan state yang tahan lama, binary yang di-bake ke dalam image, dan perilaku restart yang aman.

Jika Anda menginginkan “OpenClaw 24/7 seharga ~$5”, ini adalah penyiapan andal yang paling sederhana.
Harga Hetzner berubah-ubah; pilih VPS Debian/Ubuntu terkecil lalu tingkatkan jika Anda mengalami OOM.

Pengingat model keamanan:

- Agen bersama di perusahaan tidak masalah selama semua orang berada dalam batas kepercayaan yang sama dan runtime hanya untuk bisnis.
- Pertahankan pemisahan yang ketat: VPS/runtime khusus + akun khusus; jangan ada profil Apple/Google/browser/password manager pribadi di host tersebut.
- Jika pengguna bersifat adversarial satu sama lain, pisahkan berdasarkan gateway/host/pengguna OS.

Lihat [Keamanan](/id/gateway/security) dan [Hosting VPS](/id/vps).

## Apa yang kita lakukan (dengan istilah sederhana)?

- Menyewa server Linux kecil (VPS Hetzner)
- Menginstal Docker (runtime aplikasi yang terisolasi)
- Menjalankan Gateway OpenClaw di Docker
- Menyimpan `~/.openclaw` + `~/.openclaw/workspace` di host (bertahan setelah restart/rebuild)
- Mengakses Control UI dari laptop Anda melalui tunnel SSH

State `~/.openclaw` yang di-mount itu mencakup `openclaw.json`, per-agen
`agents/<agentId>/agent/auth-profiles.json`, dan `.env`.

Gateway dapat diakses melalui:

- SSH port forwarding dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini mengasumsikan Ubuntu atau Debian di Hetzner.  
Jika Anda menggunakan VPS Linux lain, sesuaikan paketnya.
Untuk alur Docker generik, lihat [Docker](/id/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Provision VPS Hetzner
2. Instal Docker
3. Clone repositori OpenClaw
4. Buat direktori host yang persisten
5. Konfigurasikan `.env` dan `docker-compose.yml`
6. Bake binary yang diperlukan ke dalam image
7. `docker compose up -d`
8. Verifikasi persistensi dan akses Gateway

---

## Yang Anda perlukan

- VPS Hetzner dengan akses root
- Akses SSH dari laptop Anda
- Kenyamanan dasar dengan SSH + copy/paste
- ~20 menit
- Docker dan Docker Compose
- Kredensial auth model
- Kredensial provider opsional
  - QR WhatsApp
  - token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Provision VPS">
    Buat VPS Ubuntu atau Debian di Hetzner.

    Sambungkan sebagai root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Panduan ini mengasumsikan VPS bersifat stateful.
    Jangan perlakukan VPS ini sebagai infrastruktur sekali pakai.

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

    Panduan ini mengasumsikan Anda akan membangun image kustom untuk menjamin persistensi binary.

  </Step>

  <Step title="Buat direktori host yang persisten">
    Container Docker bersifat ephemeral.
    Semua state jangka panjang harus berada di host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Atur kepemilikan ke pengguna container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Konfigurasikan variabel environment">
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

    Biarkan `OPENCLAW_GATEWAY_TOKEN` kosong kecuali Anda memang ingin
    mengelolanya melalui `.env`; OpenClaw menulis token gateway acak ke
    config saat startup pertama. Buat password keyring lalu tempelkan ke
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini untuk env container/runtime seperti `OPENCLAW_GATEWAY_TOKEN`.
    Auth OAuth/API key provider yang disimpan berada di
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
          # Rekomendasi: biarkan Gateway hanya loopback di VPS; akses melalui tunnel SSH.
          # Untuk mengeksposnya ke publik, hapus prefiks `127.0.0.1:` dan atur firewall sesuai kebutuhan.
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

    `--allow-unconfigured` hanya untuk kemudahan bootstrap, bukan pengganti konfigurasi gateway yang benar. Tetap atur auth (`gateway.auth.token` atau password) dan gunakan pengaturan bind yang aman untuk deployment Anda.

  </Step>

  <Step title="Langkah runtime Docker VM bersama">
    Gunakan panduan runtime bersama untuk alur host Docker umum:

    - [Bake binary yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build dan jalankan](/id/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten dan di mana](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Akses khusus Hetzner">
    Setelah langkah build dan launch bersama selesai, buat tunnel dari laptop Anda:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Buka:

    `http://127.0.0.1:18789/`

    Tempel secret bersama yang telah dikonfigurasi. Panduan ini menggunakan token gateway secara
    default; jika Anda beralih ke auth password, gunakan password tersebut.

  </Step>
</Steps>

Peta persistensi bersama tersedia di [Docker VM Runtime](/id/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Untuk tim yang lebih memilih alur kerja infrastructure-as-code, penyiapan Terraform yang dikelola komunitas menyediakan:

- Konfigurasi Terraform modular dengan manajemen remote state
- Provisioning otomatis melalui cloud-init
- Skrip deployment (bootstrap, deploy, backup/restore)
- Penguatan keamanan (firewall, UFW, akses khusus SSH)
- Konfigurasi tunnel SSH untuk akses gateway

**Repositori:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Config Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Pendekatan ini melengkapi penyiapan Docker di atas dengan deployment yang dapat direproduksi, infrastruktur yang dikontrol versi, dan pemulihan bencana otomatis.

> **Catatan:** Dikelola komunitas. Untuk masalah atau kontribusi, lihat tautan repositori di atas.

## Langkah berikutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi gateway](/id/gateway/configuration)
- Jaga agar OpenClaw tetap mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
