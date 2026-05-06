---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di GCP
    - Anda menginginkan Gateway kelas produksi yang selalu aktif di VM Anda sendiri
    - Anda menginginkan kendali penuh atas persistensi, biner, dan perilaku mulai ulang
summary: Jalankan OpenClaw Gateway 24/7 pada VM GCP Compute Engine (Docker) dengan status persisten
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

Jalankan OpenClaw Gateway persisten pada VM GCP Compute Engine menggunakan Docker, dengan state yang tahan lama, binari yang sudah disertakan, dan perilaku restart yang aman.

Jika Anda menginginkan "OpenClaw 24/7 seharga ~$5-12/bln", ini adalah penyiapan yang andal di Google Cloud.
Harga bervariasi menurut jenis mesin dan region; pilih VM terkecil yang sesuai dengan workload Anda dan tingkatkan skalanya jika terjadi OOM.

## Apa yang kita lakukan (secara sederhana)?

- Membuat proyek GCP dan mengaktifkan penagihan
- Membuat VM Compute Engine
- Menginstal Docker (runtime aplikasi terisolasi)
- Memulai OpenClaw Gateway di Docker
- Mempertahankan `~/.openclaw` + `~/.openclaw/workspace` pada host (bertahan melewati restart/rebuild)
- Mengakses Control UI dari laptop Anda melalui tunnel SSH

State `~/.openclaw` yang di-mount tersebut mencakup `openclaw.json`, per-agent
`agents/<agentId>/agent/auth-profiles.json`, dan `.env`.

Gateway dapat diakses melalui:

- Penerusan port SSH dari laptop Anda
- Eksposur port langsung jika Anda mengelola firewall dan token sendiri

Panduan ini menggunakan Debian pada GCP Compute Engine.
Ubuntu juga berfungsi; sesuaikan paketnya.
Untuk alur Docker generik, lihat [Docker](/id/install/docker).

---

## Jalur cepat (operator berpengalaman)

1. Buat proyek GCP + aktifkan Compute Engine API
2. Buat VM Compute Engine (e2-small, Debian 12, 20GB)
3. SSH ke VM
4. Instal Docker
5. Clone repositori OpenClaw
6. Buat direktori host persisten
7. Konfigurasi `.env` dan `docker-compose.yml`
8. Sertakan binari yang diperlukan, build, dan jalankan

---

## Yang Anda perlukan

- Akun GCP (memenuhi syarat free tier untuk e2-micro)
- gcloud CLI terinstal (atau gunakan Cloud Console)
- Akses SSH dari laptop Anda
- Kenyamanan dasar dengan SSH + salin/tempel
- ~20-30 menit
- Docker dan Docker Compose
- Kredensial autentikasi model
- Kredensial provider opsional
  - QR WhatsApp
  - token bot Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Instal gcloud CLI (atau gunakan Console)">
    **Opsi A: gcloud CLI** (direkomendasikan untuk otomatisasi)

    Instal dari [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Inisialisasi dan autentikasi:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opsi B: Cloud Console**

    Semua langkah dapat dilakukan melalui UI web di [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Buat proyek GCP">
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
    2. Beri nama dan buat
    3. Aktifkan penagihan untuk proyek
    4. Buka APIs & Services > Enable APIs > cari "Compute Engine API" > Enable

  </Step>

  <Step title="Buat VM">
    **Jenis mesin:**

    | Jenis     | Spesifikasi              | Biaya              | Catatan                                      |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~$25/bln           | Paling andal untuk build Docker lokal        |
    | e2-small  | 2 vCPU, 2GB RAM          | ~$12/bln           | Minimum yang direkomendasikan untuk build Docker |
    | e2-micro  | 2 vCPU (shared), 1GB RAM | Memenuhi syarat free tier | Sering gagal dengan OOM build Docker (exit 137) |

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
    2. Name: `openclaw-gateway`
    3. Region: `us-central1`, Zone: `us-central1-a`
    4. Machine type: `e2-small`
    5. Boot disk: Debian 12, 20GB
    6. Create

  </Step>

  <Step title="SSH ke VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Klik tombol "SSH" di sebelah VM Anda pada dasbor Compute Engine.

    Catatan: propagasi kunci SSH dapat memerlukan 1-2 menit setelah VM dibuat. Jika koneksi ditolak, tunggu dan coba lagi.

  </Step>

  <Step title="Instal Docker (pada VM)">
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

    Panduan ini mengasumsikan Anda akan membuat image kustom untuk menjamin persistensi binari.

  </Step>

  <Step title="Buat direktori host persisten">
    Container Docker bersifat efemeral.
    Semua state jangka panjang harus berada pada host.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Konfigurasi variabel lingkungan">
    Buat `.env` di root repositori.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Biarkan `OPENCLAW_GATEWAY_TOKEN` kosong kecuali Anda secara eksplisit ingin
    mengelolanya melalui `.env`; OpenClaw menulis token gateway acak ke
    config saat pertama kali dimulai. Buat kata sandi keyring dan tempelkan ke
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit file ini.**

    File `.env` ini adalah untuk env container/runtime seperti `OPENCLAW_GATEWAY_TOKEN`.
    Autentikasi OAuth/API-key provider yang tersimpan berada dalam
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
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
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

    `--allow-unconfigured` hanya untuk kemudahan bootstrap, bukan pengganti konfigurasi gateway yang tepat. Tetap atur autentikasi (`gateway.auth.token` atau kata sandi) dan gunakan pengaturan bind yang aman untuk deployment Anda.

  </Step>

  <Step title="Langkah runtime VM Docker bersama">
    Gunakan panduan runtime bersama untuk alur host Docker umum:

    - [Sertakan binari yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build dan jalankan](/id/install/docker-vm-runtime#build-and-launch)
    - [Apa yang persisten di mana](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Catatan peluncuran khusus GCP">
    Pada GCP, jika build gagal dengan `Killed` atau `exit code 137` selama `pnpm install --frozen-lockfile`, VM kehabisan memori. Gunakan minimal `e2-small`, atau `e2-medium` untuk build pertama yang lebih andal.

    Saat bind ke LAN (`OPENCLAW_GATEWAY_BIND=lan`), konfigurasi origin browser tepercaya sebelum melanjutkan:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jika Anda mengubah port gateway, ganti `18789` dengan port yang Anda konfigurasi.

  </Step>

  <Step title="Akses dari laptop Anda">
    Buat tunnel SSH untuk meneruskan port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Buka di browser Anda:

    `http://127.0.0.1:18789/`

    Cetak ulang tautan dasbor yang bersih:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jika UI meminta autentikasi shared-secret, tempelkan token atau
    kata sandi yang dikonfigurasi ke pengaturan Control UI. Alur Docker ini menulis token secara
    default; jika Anda mengganti config container ke autentikasi kata sandi, gunakan
    kata sandi tersebut sebagai gantinya.

    Jika Control UI menampilkan `unauthorized` atau `disconnected (1008): pairing required`, setujui perangkat browser:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Perlu referensi persistensi dan pembaruan bersama lagi?
    Lihat [Runtime VM Docker](/id/install/docker-vm-runtime#what-persists-where) dan [pembaruan Runtime VM Docker](/id/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Pemecahan masalah

**Koneksi SSH ditolak**

Propagasi kunci SSH dapat memerlukan 1-2 menit setelah VM dibuat. Tunggu dan coba lagi.

**Masalah OS Login**

Periksa profil OS Login Anda:

```bash
gcloud compute os-login describe-profile
```

Pastikan akun Anda memiliki izin IAM yang diperlukan (Compute OS Login atau Compute OS Admin Login).

**Kehabisan memori (OOM)**

Jika build Docker gagal dengan `Killed` dan `exit code 137`, VM dihentikan oleh OOM. Upgrade ke e2-small (minimum) atau e2-medium (direkomendasikan untuk build lokal yang andal):

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Akun layanan (praktik terbaik keamanan)

Untuk penggunaan pribadi, akun pengguna default Anda sudah cukup.

Untuk otomatisasi atau pipeline CI/CD, buat akun layanan khusus dengan izin minimal:

1. Buat akun layanan:

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

Hindari penggunaan peran Owner untuk otomatisasi. Gunakan prinsip hak akses paling sedikit.

Lihat [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) untuk detail peran IAM.

---

## Langkah berikutnya

- Siapkan kanal perpesanan: [Kanal](/id/channels)
- Pasangkan perangkat lokal sebagai Node: [Node](/id/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)

## Terkait

- [Ringkasan instalasi](/id/install)
- [Azure](/id/install/azure)
- [Hosting VPS](/id/vps)
