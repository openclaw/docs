---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari VPS berbayar sederhana untuk OpenClaw
summary: Host OpenClaw di Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T14:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Jalankan Gateway OpenClaw persisten pada DigitalOcean Droplet (~$6/bulan untuk paket Basic 1 GB).

DigitalOcean merupakan opsi VPS berbayar yang mudah digunakan. Untuk opsi yang lebih murah atau gratis:

- [Hetzner](/id/install/hetzner) -- lebih banyak inti/RAM per dolar.
- [Oracle Cloud](/id/install/oracle) -- tingkat ARM Always Free (hingga 4 OCPU, RAM 24 GB), tetapi proses pendaftarannya terkadang rumit dan hanya mendukung ARM.

## Prasyarat

- Akun DigitalOcean ([daftar](https://cloud.digitalocean.com/registrations/new))
- Pasangan kunci SSH (atau bersedia menggunakan autentikasi kata sandi)
- Sekitar 20 menit

## Penyiapan

<Steps>
  <Step title="Buat Droplet">
    <Warning>
    Gunakan citra dasar yang bersih (Ubuntu 24.04 LTS). Hindari citra sekali klik dari Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan pengaturan bawaan firewall-nya.
    </Warning>

    1. Masuk ke [DigitalOcean](https://cloud.digitalocean.com/).
    2. Klik **Create > Droplets**.
    3. Pilih:
       - **Region:** Yang paling dekat dengan Anda
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
       - **Authentication:** Kunci SSH (disarankan) atau kata sandi
    4. Klik **Create Droplet** dan catat alamat IP-nya.

  </Step>

  <Step title="Hubungkan dan instal">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Instal Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Instal OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Buat pengguna non-root yang akan memiliki status dan layanan OpenClaw.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Gunakan shell root hanya untuk bootstrap sistem. Jalankan perintah OpenClaw sebagai pengguna non-root `openclaw` agar status disimpan di bawah `/home/openclaw/.openclaw/` dan Gateway diinstal sebagai layanan systemd `--user` milik pengguna tersebut.

  </Step>

  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wisaya akan memandu Anda melalui autentikasi model, penyiapan saluran, pembuatan token gateway, dan instalasi daemon (layanan pengguna systemd).

  </Step>

  <Step title="Tambahkan swap (disarankan untuk Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verifikasi gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Akses UI Kontrol">
    Secara bawaan, gateway terikat ke local loopback. Pilih salah satu opsi berikut.

    **Opsi A: Tunnel SSH (paling sederhana)**

    ```bash
    # Dari mesin lokal Anda
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Kemudian buka `http://localhost:18789`.

    **Opsi B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Kemudian buka `https://<magicdns>/` dari perangkat mana pun di tailnet Anda.

    Tailscale Serve mengautentikasi lalu lintas UI Kontrol dan WebSocket melalui header identitas tailnet, yang mengasumsikan bahwa host gateway itu sendiri tepercaya. Endpoint API HTTP tetap mengikuti mode autentikasi normal gateway (token/kata sandi). Untuk mewajibkan kredensial rahasia bersama secara eksplisit melalui Serve, tetapkan `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

    **Opsi C: Pengikatan tailnet (tanpa Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Kemudian buka `http://<tailscale-ip>:18789` (token diperlukan).

  </Step>
</Steps>

## Persistensi dan pencadangan

Status OpenClaw disimpan di bawah:

- `~/.openclaw/` -- `openclaw.json`, kredensial saluran/penyedia, `auth-profiles.json` per agen, dan data sesi.
- `~/.openclaw/workspace/` -- ruang kerja agen (SOUL.md, memori, artefak).

Data ini tetap tersedia setelah Droplet dimulai ulang. Untuk membuat snapshot portabel:

```bash
openclaw backup create
```

Snapshot DigitalOcean mencadangkan seluruh Droplet; `openclaw backup create` bersifat portabel antarhost.

## Kiat untuk RAM 1 GB

Droplet seharga $6 hanya memiliki RAM 1 GB. Agar semuanya tetap berjalan lancar:

- Pastikan langkah swap di atas tercantum dalam `/etc/fstab` agar tetap aktif setelah sistem dimulai ulang.
- Utamakan model berbasis API (Claude, GPT) daripada model lokal -- inferensi LLM lokal tidak dapat berjalan dengan RAM 1 GB.
- Tetapkan `agents.defaults.model.primary` ke model yang lebih kecil jika Anda mengalami OOM pada prompt besar.
- Pantau dengan `free -h` dan `htop`.

## Pemecahan masalah

**Gateway tidak dapat dimulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Port sudah digunakan** -- Jalankan `lsof -i :18789` untuk menemukan prosesnya, lalu hentikan proses tersebut.

**Kehabisan memori** -- Pastikan swap aktif dengan `free -h`. Jika OOM masih terjadi, beralihlah ke model berbasis API (Claude, GPT), bukan model lokal, atau tingkatkan ke Droplet 2 GB.

## Langkah selanjutnya

- [Saluran](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Pembaruan](/id/install/updating) -- selalu gunakan versi terbaru OpenClaw

## Terkait

- [Ringkasan instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
- [Hosting VPS](/id/vps)
