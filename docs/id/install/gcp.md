---
read_when:
    - Anda ingin OpenClaw berjalan 24/7 di GCP
    - Anda menginginkan Gateway kelas produksi yang selalu aktif di VM Anda sendiri
    - Anda menginginkan kendali penuh atas persistensi, berkas biner, dan perilaku mulai ulang
summary: Jalankan Gateway OpenClaw 24/7 pada VM GCP Compute Engine (Docker) dengan penyimpanan persisten
title: GCP
x-i18n:
    generated_at: "2026-07-12T14:19:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

Jalankan Gateway OpenClaw persisten pada VM GCP Compute Engine menggunakan Docker, dengan status tahan lama, biner bawaan, dan perilaku mulai ulang yang aman.

Harga bervariasi berdasarkan jenis mesin dan wilayah; pilih VM terkecil yang sesuai dengan beban kerja Anda dan tingkatkan kapasitasnya jika terjadi OOM.

Gateway dapat diakses melalui penerusan porta SSH dari laptop Anda, atau melalui pemaparan porta langsung jika Anda mengelola firewall dan token sendiri.

Panduan ini menggunakan Debian pada GCP Compute Engine. Ubuntu juga dapat digunakan; sesuaikan paketnya. Untuk alur Docker generik, lihat [Docker](/id/install/docker).

## Yang Anda perlukan

- Akun GCP (`e2-micro` memenuhi syarat tingkat gratis)
- CLI `gcloud`, atau [Cloud Console](https://console.cloud.google.com)
- Akses SSH dari laptop Anda
- Docker dan Docker Compose
- Kredensial autentikasi model
- Kredensial penyedia opsional (QR WhatsApp, token bot Telegram, OAuth Gmail)
- Sekitar 20–30 menit

## Jalur cepat

1. Buat proyek GCP, aktifkan penagihan dan API Compute Engine
2. Buat VM Compute Engine (`e2-small`, Debian 12, 20 GB)
3. Masuk ke VM melalui SSH, lalu instal Docker
4. Klon repositori OpenClaw
5. Buat direktori hos persisten
6. Konfigurasikan `.env` dan `docker-compose.yml`
7. Sematkan biner yang diperlukan, lakukan build, dan jalankan

<Steps>
  <Step title="Instal CLI gcloud (atau gunakan Console)">
    Instal dari [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install), lalu:

    ```bash
    gcloud init
    gcloud auth login
    ```

    Atau lakukan semua langkah di bawah melalui antarmuka web [Cloud Console](https://console.cloud.google.com).

  </Step>

  <Step title="Buat proyek GCP">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    Aktifkan penagihan di [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (diperlukan untuk Compute Engine).

    Padanan di Console: IAM & Admin > Create Project, aktifkan penagihan, lalu APIs & Services > Enable APIs > "Compute Engine API" > Enable.

  </Step>

  <Step title="Buat VM">
    | Jenis     | Spesifikasi               | Biaya                  | Catatan                                              |
    | --------- | ------------------------- | ---------------------- | ---------------------------------------------------- |
    | e2-medium | 2 vCPU, RAM 4 GB          | Sekitar $25/bulan      | Paling andal untuk build Docker lokal                |
    | e2-small  | 2 vCPU, RAM 2 GB          | Sekitar $12/bulan      | Minimum yang disarankan untuk build Docker           |
    | e2-micro  | 2 vCPU (bersama), RAM 1 GB | Memenuhi syarat tingkat gratis | Sering gagal karena OOM saat build Docker (keluar 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="Masuk ke VM melalui SSH">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Console: klik "SSH" di samping VM pada dasbor Compute Engine.

    Penyebaran kunci SSH dapat memerlukan waktu 1–2 menit setelah VM dibuat; tunggu dan coba lagi jika koneksi ditolak.

  </Step>

  <Step title="Instal Docker (pada VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Keluar lalu masuk kembali agar perubahan grup diterapkan, kemudian masuk lagi melalui SSH:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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

    Panduan ini membuat image khusus agar semua biner yang Anda sematkan tetap tersedia setelah mulai ulang.

  </Step>

  <Step title="Buat direktori hos persisten">
    Kontainer Docker bersifat sementara; semua status berumur panjang harus disimpan pada hos.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Konfigurasikan variabel lingkungan">
    Buat `.env` di root repositori:

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

    Tetapkan `OPENCLAW_GATEWAY_TOKEN` untuk mengelola token Gateway yang stabil melalui
    `.env`; jika tidak, konfigurasikan `gateway.auth.token` sebelum mengandalkan klien
    setelah mulai ulang. Jika keduanya tidak ditetapkan, OpenClaw menggunakan token khusus
    waktu proses untuk proses mulai tersebut. Buat kata sandi keyring untuk `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Jangan commit berkas ini.** Berkas ini menyimpan lingkungan kontainer/waktu proses seperti
    `OPENCLAW_GATEWAY_TOKEN`. Autentikasi OAuth/kunci API penyedia yang disimpan berada dalam
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
          # Disarankan: pertahankan Gateway hanya pada loopback di VM; akses melalui terowongan SSH.
          # Untuk memaparkannya secara publik, hapus prefiks `127.0.0.1:` dan konfigurasikan firewall sebagaimana mestinya.
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

    `--allow-unconfigured` hanya untuk memudahkan proses bootstrap, bukan pengganti konfigurasi Gateway yang sebenarnya. Tetap atur autentikasi (`gateway.auth.token` atau kata sandi) dan mode pengikatan yang aman untuk penerapan Anda.

  </Step>

  <Step title="Langkah waktu proses VM Docker bersama">
    Ikuti panduan waktu proses bersama untuk alur hos Docker umum:

    - [Sematkan biner yang diperlukan ke dalam image](/id/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Lakukan build dan jalankan](/id/install/docker-vm-runtime#build-and-launch)
    - [Yang dipertahankan dan lokasinya](/id/install/docker-vm-runtime#what-persists-where)
    - [Pembaruan](/id/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Catatan peluncuran khusus GCP">
    Jika build gagal dengan `Killed` atau `exit code 137` saat menjalankan `pnpm install --frozen-lockfile`, VM kehabisan memori. Gunakan setidaknya `e2-small`, atau `e2-medium` agar build pertama lebih andal.

    Saat mengikat ke LAN (`OPENCLAW_GATEWAY_BIND=lan`), konfigurasikan asal peramban tepercaya sebelum melanjutkan:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Ganti `18789` dengan porta yang Anda konfigurasikan jika Anda mengubahnya.

  </Step>

  <Step title="Akses dari laptop Anda">
    Buat terowongan SSH untuk meneruskan porta Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Buka `http://127.0.0.1:18789/` di peramban Anda.

    Tampilkan kembali tautan dasbor yang bersih:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jika antarmuka meminta autentikasi rahasia bersama, tempel token atau
    kata sandi yang dikonfigurasikan ke pengaturan Control UI (alur Docker ini menulis token secara
    default; gunakan kata sandi yang Anda konfigurasikan jika Anda beralih ke autentikasi
    kata sandi).

    Jika Control UI menampilkan `unauthorized` atau `disconnected (1008): pairing required`, setujui perangkat peramban:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Lihat [Waktu Proses VM Docker](/id/install/docker-vm-runtime#what-persists-where) untuk peta persistensi bersama dan [alur pembaruan](/id/install/docker-vm-runtime#updates).

  </Step>
</Steps>

## Pemecahan masalah

**Koneksi SSH ditolak**

Penyebaran kunci SSH dapat memerlukan waktu 1–2 menit setelah VM dibuat. Tunggu dan coba lagi.

**Masalah OS Login**

Periksa profil OS Login Anda:

```bash
gcloud compute os-login describe-profile
```

Pastikan akun Anda memiliki izin IAM yang diperlukan (Compute OS Login atau Compute OS Admin Login).

**Kehabisan memori (OOM)**

Jika build Docker gagal dengan `Killed` dan `exit code 137`, proses VM dihentikan karena OOM:

```bash
# Hentikan VM terlebih dahulu
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Ubah jenis mesin
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Jalankan VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## Akun layanan (praktik terbaik keamanan)

Untuk penggunaan pribadi, akun pengguna default Anda dapat digunakan dengan baik. Untuk otomatisasi atau CI/CD, buat akun layanan khusus dengan izin minimum:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

Hindari peran Owner untuk otomatisasi; gunakan peran tersempit yang dapat digunakan. Lihat [Memahami peran](https://cloud.google.com/iam/docs/understanding-roles).

## Langkah selanjutnya

- Siapkan saluran perpesanan: [Saluran](/id/channels)
- Pasangkan perangkat lokal sebagai Node: [Node](/id/nodes)
- Konfigurasikan Gateway: [Konfigurasi Gateway](/id/gateway/configuration)

## Terkait

- [Ringkasan instalasi](/id/install)
- [Azure](/id/install/azure)
- [Hosting VPS](/id/vps)
