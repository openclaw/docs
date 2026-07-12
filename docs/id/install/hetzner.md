---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di VPS cloud (bukan di laptop Anda)
    - Anda menginginkan Gateway kelas produksi yang selalu aktif di VPS Anda sendiri
    - Anda menginginkan kendali penuh atas persistensi, berkas biner, dan perilaku mulai ulang
    - Anda menjalankan OpenClaw di Docker pada Hetzner atau penyedia serupa
summary: Jalankan Gateway OpenClaw 24/7 pada VPS Hetzner murah (Docker) dengan status persisten dan biner bawaan
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T14:19:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Jalankan Gateway OpenClaw persisten pada VPS Hetzner menggunakan Docker, dengan status tahan lama, biner bawaan, dan perilaku mulai ulang yang aman.

Harga Hetzner dapat berubah; pilih VPS Debian/Ubuntu terkecil yang memenuhi kebutuhan dan tingkatkan kapasitasnya jika terjadi OOM.

Gateway dapat diakses melalui penerusan porta SSH dari laptop Anda, atau melalui pemaparan porta langsung jika Anda mengelola firewall dan token sendiri.

Pengingat model keamanan:

- Agen yang digunakan bersama dalam perusahaan dapat digunakan jika semua orang berada dalam batas kepercayaan yang sama dan runtime hanya digunakan untuk keperluan bisnis.
- Pertahankan pemisahan ketat: VPS/runtime khusus + akun khusus; jangan gunakan profil Apple/Google/peramban/pengelola kata sandi pribadi pada host tersebut.
- Jika para pengguna dapat saling bermusuhan, pisahkan berdasarkan Gateway/host/pengguna OS.

Lihat [Keamanan](/id/gateway/security) dan [Hosting VPS](/id/vps).

Panduan ini mengasumsikan penggunaan Ubuntu atau Debian di Hetzner. Pada VPS Linux lain, sesuaikan paketnya. Untuk alur Docker generik, lihat [Docker](/id/install/docker).

## Yang Anda perlukan

- VPS Hetzner dengan akses root
- Akses SSH dari laptop Anda
- Docker dan Docker Compose
- Kredensial autentikasi model
- Kredensial penyedia opsional (QR WhatsApp, token bot Telegram, OAuth Gmail)
- ~20 menit

## Jalur cepat

1. Sediakan VPS Hetzner
2. Instal Docker
3. Klona repositori OpenClaw
4. Buat direktori host persisten
5. Konfigurasikan `.env` dan `docker-compose.yml`
6. Tanamkan biner yang diperlukan ke dalam image
7. `docker compose up -d`
8. Verifikasi persistensi dan akses Gateway

<Steps>
  <Step title="Sediakan VPS">
    Buat VPS Ubuntu atau Debian di Hetzner, lalu hubungkan sebagai root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Perlakukan VPS sebagai infrastruktur yang memiliki status, bukan infrastruktur sekali pakai.

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

  <Step title="Klona repositori OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Panduan ini membangun image khusus agar semua biner yang Anda tanamkan tetap tersedia setelah mulai ulang.

  </Step>

  <Step title="Buat direktori host persisten">
    Kontainer Docker bersifat sementara; semua status berumur panjang harus berada di host.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Atur kepemilikan ke pengguna kontainer (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Konfigurasikan variabel lingkungan">
    Buat `.env` di root repositori:

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

    Atur `OPENCLAW_GATEWAY_TOKEN` untuk mengelola token Gateway yang stabil melalui
    `.env`; jika tidak, konfigurasikan `gateway.auth.token` sebelum mengandalkan klien
    setelah mulai ulang. Jika keduanya tidak diatur, OpenClaw menggunakan token khusus runtime
    untuk proses awal tersebut. Buat kata sandi keyring untuk `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit berkas ini.** Berkas ini menyimpan lingkungan kontainer/runtime seperti
    `OPENCLAW_GATEWAY_TOKEN`. Autentikasi OAuth/kunci API penyedia yang tersimpan berada dalam
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` yang dipasang.

  </Step>

  <Step title="Konfigurasi Docker Compose">
    Buat atau perbarui `docker-compose.yml`:

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
          # Disarankan: pertahankan Gateway hanya pada loopback di VPS; akses melalui terowongan SSH.
          # Untuk memaparkannya secara publik, hapus awalan `127.0.0.1:` dan konfigurasikan firewall sebagaimana mestinya.
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

    `--allow-unconfigured` hanya ditujukan untuk memudahkan bootstrap, bukan sebagai pengganti konfigurasi Gateway yang sebenarnya. Tetap atur autentikasi (`gateway.auth.token` atau kata sandi) dan mode pengikatan yang aman untuk penerapan Anda.

  </Step>

  <Step title="Langkah runtime VM Docker bersama">
    Ikuti panduan runtime bersama untuk alur host Docker umum:

    - [Tanamkan biner yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Bangun dan jalankan](/id/install/docker-vm-runtime#build-and-launch)
    - [Lokasi persistensi data](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Akses khusus Hetzner">
    Setelah menyelesaikan langkah pembangunan dan peluncuran bersama, buka terowongan.

    **Prasyarat:** pastikan konfigurasi sshd VPS Anda mengizinkan penerusan TCP. Jika Anda
    telah memperketat konfigurasi SSH, periksa `/etc/ssh/sshd_config` dan atur:

    ```text
    AllowTcpForwarding local
    ```

    `local` mengizinkan penerusan lokal `ssh -L` dari laptop Anda sekaligus memblokir
    penerusan jarak jauh dari server. Mengaturnya ke `no` menyebabkan terowongan gagal dengan:
    `channel 3: open failed: administratively prohibited: open failed`

    Setelah memastikan penerusan TCP diaktifkan, mulai ulang layanan SSH
    (`systemctl restart ssh`) dan jalankan terowongan dari laptop Anda:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Buka `http://127.0.0.1:18789/` dan tempelkan rahasia bersama yang telah dikonfigurasi.
    Panduan ini menggunakan token Gateway secara default; gunakan kata sandi yang telah dikonfigurasi
    jika Anda beralih ke autentikasi kata sandi.

  </Step>
</Steps>

Peta persistensi bersama tersedia di [Runtime VM Docker](/id/install/docker-vm-runtime#what-persists-where).

## Infrastruktur sebagai Kode (Terraform)

Untuk tim yang memilih alur kerja infrastruktur sebagai kode, konfigurasi Terraform yang dikelola komunitas menyediakan:

- Konfigurasi Terraform modular dengan pengelolaan status jarak jauh
- Penyediaan otomatis melalui cloud-init
- Skrip penerapan (bootstrap, penerapan, pencadangan/pemulihan)
- Penguatan keamanan (firewall, UFW, akses hanya melalui SSH)
- Konfigurasi terowongan SSH untuk akses Gateway

**Repositori:**

- Infrastruktur: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfigurasi Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Pendekatan ini melengkapi konfigurasi Docker di atas dengan penerapan yang dapat direproduksi, infrastruktur yang dikontrol versinya, dan pemulihan bencana otomatis.

<Note>
Dikelola oleh komunitas. Untuk masalah atau kontribusi, lihat tautan repositori di atas.
</Note>

## Langkah berikutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
- Jaga agar OpenClaw tetap mutakhir: [Memperbarui](/id/install/updating)

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Docker](/id/install/docker)
- [Hosting VPS](/id/vps)
