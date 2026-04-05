---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di GCP
    - Anda menginginkan Gateway kelas produksi yang selalu aktif di VM milik Anda sendiri
    - Anda menginginkan kontrol penuh atas persistensi, biner, dan perilaku restart
summary: Jalankan OpenClaw Gateway 24/7 di GCP Compute Engine VM (Docker) dengan state yang tahan lama
title: GCP
x-i18n:
    generated_at: "2026-04-05T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73daaee3de71dad5175f42abf3e11355f2603b2f9e2b2523eac4d4c7015e3ebc
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw di GCP Compute Engine (Docker, Panduan VPS Produksi)

## Tujuan

Jalankan OpenClaw Gateway persisten di GCP Compute Engine VM menggunakan Docker, dengan state yang tahan lama, biner yang sudah dibenamkan, dan perilaku restart yang aman.

Jika Anda menginginkan "OpenClaw 24/7 seharga ~$5-12/bulan", ini adalah penyiapan yang andal di Google Cloud.
Harga bervariasi menurut jenis mesin dan region; pilih VM terkecil yang sesuai dengan beban kerja Anda dan tingkatkan jika Anda mengalami OOM.

## Apa yang kita lakukan (dengan istilah sederhana)?

- Membuat project GCP dan mengaktifkan penagihan
- Membuat Compute Engine VM
- Memasang Docker (runtime aplikasi yang terisolasi)
- Menjalankan OpenClaw Gateway di Docker
- Menyimpan `~/.openclaw` + `~/.openclaw/workspace` secara persisten di host (tetap ada setelah restart/rebuild)
- Mengakses Control UI dari laptop Anda melalui SSH tunnel

State `~/.openclaw` yang di-mount itu mencakup `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json`, dan `.env`.

Gateway dapat diakses melalui:

- Penerusan port SSH dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini menggunakan Debian di GCP Compute Engine.
Ubuntu juga berfungsi; sesuaikan paketnya.
Untuk alur Docker generik, lihat [Docker](/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Buat project GCP + aktifkan Compute Engine API
2. Buat Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH ke VM
4. Pasang Docker
5. Clone repositori OpenClaw
6. Buat direktori host persisten
7. Konfigurasikan `.env` dan `docker-compose.yml`
8. Benamkan biner yang diperlukan, build, dan jalankan

---

## Yang Anda butuhkan

- Akun GCP (free tier memenuhi syarat untuk e2-micro)
- gcloud CLI terpasang (atau gunakan Cloud Console)
- Akses SSH dari laptop Anda
- Pemahaman dasar tentang SSH + salin/tempel
- ~20-30 menit
- Docker dan Docker Compose
- Kredensial auth model
- Kredensial provider opsional
  - QR WhatsApp
  - token bot Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Pasang gcloud CLI (atau gunakan Console)">
    **Opsi A: gcloud CLI** (direkomendasikan untuk otomasi)

    Pasang dari [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inisialisasi dan autentikasi:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opsi B: Cloud Console**

    Semua langkah dapat dilakukan melalui UI web di [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Buat project GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Aktifkan penagihan di [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (diperlukan untuk Compute Engine).

    Aktifkan Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Buka IAM & Admin > Create Project
    2. Beri nama lalu buat
    3. Aktifkan penagihan untuk project tersebut
    4. Buka APIs & Services > Enable APIs > cari "Compute Engine API" > Enable

  </Step>

  <Step title="Buat VM">
    **Jenis mesin:**

    | Type      | Spesifikasi              | Biaya              | Catatan                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/bulan         | Paling andal untuk build Docker lokal        |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/bulan         | Minimum yang direkomendasikan untuk build Docker |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Memenuhi syarat free tier | Sering gagal karena OOM saat build Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Buka Compute Engine > VM instances > Create instance
    2. Nama: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Jenis mesin: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="SSH ke VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klik tombol "SSH" di sebelah VM Anda pada dashboard Compute Engine.

    Catatan: propagasi kunci SSH dapat memakan waktu 1-2 menit setelah pembuatan VM. Jika koneksi ditolak, tunggu lalu coba lagi.

  </Step>

  <Step title="Pasang Docker (di VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Keluar lalu masuk kembali agar perubahan grup berlaku:

    ```bash
    exit
    ```

    Lalu SSH kembali:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Konfigurasikan variabel lingkungan">
    Buat `.env` di root repositori.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=change-me-now
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=change-me-now
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Buat secret yang kuat:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini digunakan untuk env container/runtime seperti `OPENCLAW_GATEWAY_TOKEN`.
    Auth OAuth/kunci API provider yang disimpan berada di
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
          # Direkomendasikan: biarkan Gateway hanya loopback di VM; akses melalui SSH tunnel.
          # Untuk mengeksposnya secara publik, hapus awalan `127.0.0.1:` dan konfigurasikan firewall sesuai kebutuhan.
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

    - [Benamkan biner yang diperlukan ke dalam image](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build dan jalankan](/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten di mana](/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Catatan peluncuran khusus GCP">
    Di GCP, jika build gagal dengan `Killed` atau `exit code 137` selama `pnpm install --frozen-lockfile`, VM kehabisan memori. Gunakan minimal `e2-small`, atau `e2-medium` untuk build pertama yang lebih andal.

    Saat bind ke LAN (`OPENCLAW_GATEWAY_BIND=lan`), konfigurasikan origin browser tepercaya sebelum melanjutkan:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jika Anda mengubah port gateway, ganti `18789` dengan port yang dikonfigurasi.

  </Step>

  <Step title="Akses dari laptop Anda">
    Buat SSH tunnel untuk meneruskan port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Buka di browser Anda:

    `http://127.0.0.1:18789/`

    Cetak ulang tautan dashboard yang bersih:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jika UI meminta auth shared-secret, tempel token atau
    password yang sudah dikonfigurasi ke pengaturan Control UI. Alur Docker ini secara default menulis token; jika Anda mengubah konfigurasi container ke auth berbasis password, gunakan
    password tersebut.

    Jika Control UI menampilkan `unauthorized` atau `disconnected (1008): pairing required`, setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Butuh referensi persistensi bersama dan pembaruan lagi?
    Lihat [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) dan [pembaruan Docker VM Runtime](/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Pemecahan masalah

**Koneksi SSH ditolak**

Propagasi kunci SSH dapat memakan waktu 1-2 menit setelah pembuatan VM. Tunggu lalu coba lagi.

**Masalah OS Login**

Periksa profil OS Login Anda:

```bash
gcloud compute os-login describe-profile
```

Pastikan akun Anda memiliki izin IAM yang diperlukan (Compute OS Login atau Compute OS Admin Login).

**Kehabisan memori (OOM)**

Jika build Docker gagal dengan `Killed` dan `exit code 137`, VM dihentikan oleh OOM. Tingkatkan ke e2-small (minimum) atau e2-medium (direkomendasikan untuk build lokal yang andal):

```bash
# Hentikan VM terlebih dahulu
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Ubah jenis mesin
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Mulai VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Service account (praktik terbaik keamanan)

Untuk penggunaan pribadi, akun pengguna default Anda sudah cukup.

Untuk otomasi atau pipeline CI/CD, buat service account khusus dengan izin minimum:

1. Buat service account:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Berikan peran Compute Instance Admin (atau peran kustom yang lebih sempit):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Hindari menggunakan peran Owner untuk otomasi. Gunakan prinsip least privilege.

Lihat [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) untuk detail peran IAM.

---

## Langkah selanjutnya

- Siapkan channel pesan: [Channels](/id/channels)
- Pasangkan perangkat lokal sebagai node: [Nodes](/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)
