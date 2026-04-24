---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari VPS berbayar sederhana untuk OpenClaw
summary: Host OpenClaw di Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T09:13:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Jalankan Gateway OpenClaw persisten di Droplet DigitalOcean.

## Prasyarat

- Akun DigitalOcean ([daftar](https://cloud.digitalocean.com/registrations/new))
- Sepasang kunci SSH (atau bersedia menggunakan autentikasi kata sandi)
- Sekitar 20 menit

## Penyiapan

<Steps>
  <Step title="Buat Droplet">
    <Warning>
    Gunakan image dasar yang bersih (Ubuntu 24.04 LTS). Hindari image 1-click Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan default firewall mereka.
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

  <Step title="Hubungkan dan pasang">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Pasang Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Pasang OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard akan memandu Anda melalui autentikasi model, penyiapan channel, pembuatan token gateway, dan pemasangan daemon (systemd).

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

  <Step title="Akses Control UI">
    Gateway melakukan bind ke loopback secara default. Pilih salah satu opsi berikut.

    **Opsi A: tunnel SSH (paling sederhana)**

    ```bash
    # Dari mesin lokal Anda
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

    Lalu buka `https://<magicdns>/` dari perangkat mana pun di tailnet Anda.

    **Opsi C: bind tailnet (tanpa Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Lalu buka `http://<tailscale-ip>:18789` (token diperlukan).

  </Step>
</Steps>

## Pemecahan masalah

**Gateway tidak mau mulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Port sudah digunakan** -- Jalankan `lsof -i :18789` untuk menemukan prosesnya, lalu hentikan.

**Kehabisan memori** -- Verifikasi bahwa swap aktif dengan `free -h`. Jika masih terkena OOM, gunakan model berbasis API (Claude, GPT) alih-alih model lokal, atau upgrade ke Droplet 2 GB.

## Langkah selanjutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi config
- [Memperbarui](/id/install/updating) -- jaga OpenClaw tetap mutakhir

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
- [Hosting VPS](/id/vps)
