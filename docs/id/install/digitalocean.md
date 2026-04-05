---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari VPS berbayar sederhana untuk OpenClaw
summary: Host OpenClaw di Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T13:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

Jalankan OpenClaw Gateway persisten di Droplet DigitalOcean.

## Prasyarat

- Akun DigitalOcean ([signup](https://cloud.digitalocean.com/registrations/new))
- Pasangan kunci SSH (atau bersedia menggunakan auth kata sandi)
- Sekitar 20 menit

## Penyiapan

<Steps>
  <Step title="Buat Droplet">
    <Warning>
    Gunakan image dasar yang bersih (Ubuntu 24.04 LTS). Hindari image 1-click Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan default firewall-nya.
    </Warning>

    1. Masuk ke [DigitalOcean](https://cloud.digitalocean.com/).
    2. Klik **Create > Droplets**.
    3. Pilih:
       - **Region:** Yang paling dekat dengan Anda
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** Kunci SSH (disarankan) atau kata sandi
    4. Klik **Create Droplet** dan catat alamat IP-nya.

  </Step>

  <Step title="Hubungkan dan instal">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard memandu Anda melalui auth model, setup channel, pembuatan token gateway, dan instalasi daemon (systemd).

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
    Gateway bind ke loopback secara default. Pilih salah satu opsi berikut.

    **Opsi A: Tunnel SSH (paling sederhana)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Lalu buka `http://localhost:18789`.

    **Opsi B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Lalu buka `https://<magicdns>/` dari perangkat apa pun di tailnet Anda.

    **Opsi C: Bind tailnet (tanpa Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Lalu buka `http://<tailscale-ip>:18789` (token diperlukan).

  </Step>
</Steps>

## Pemecahan masalah

**Gateway tidak mau start** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Port sudah digunakan** -- Jalankan `lsof -i :18789` untuk menemukan prosesnya, lalu hentikan.

**Kehabisan memori** -- Verifikasi swap aktif dengan `free -h`. Jika masih terkena OOM, gunakan model berbasis API (Claude, GPT) alih-alih model lokal, atau upgrade ke Droplet 2 GB.

## Langkah berikutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Updating](/install/updating) -- selalu perbarui OpenClaw
