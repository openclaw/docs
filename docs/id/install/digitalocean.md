---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari VPS berbayar sederhana untuk OpenClaw
summary: Menghosting OpenClaw di DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:39:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

Jalankan OpenClaw Gateway persisten di DigitalOcean Droplet (~$6/bulan untuk paket Basic 1 GB).

DigitalOcean adalah jalur VPS berbayar paling sederhana. Jika Anda lebih memilih opsi yang lebih murah atau gratis:

- [Hetzner](/id/install/hetzner) — €3,79/bln, lebih banyak core/RAM per dolar.
- [Oracle Cloud](/id/install/oracle) — ARM Always Free (hingga 4 OCPU, RAM 24 GB), tetapi pendaftarannya bisa rumit dan hanya ARM.

## Prasyarat

- Akun DigitalOcean ([daftar](https://cloud.digitalocean.com/registrations/new))
- Pasangan kunci SSH (atau bersedia menggunakan autentikasi kata sandi)
- Sekitar 20 menit

## Penyiapan

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    Gunakan image dasar yang bersih (Ubuntu 24.04 LTS). Hindari image 1-klik Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan default firewall-nya.
    </Warning>

    1. Masuk ke [DigitalOcean](https://cloud.digitalocean.com/).
    2. Klik **Create > Droplets**.
    3. Pilih:
       - **Wilayah:** Yang terdekat dengan Anda
       - **Image:** Ubuntu 24.04 LTS
       - **Ukuran:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
       - **Autentikasi:** Kunci SSH (direkomendasikan) atau kata sandi
    4. Klik **Create Droplet** dan catat alamat IP-nya.

  </Step>

  <Step title="Connect and install">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Gunakan shell root hanya untuk bootstrap sistem. Jalankan perintah OpenClaw sebagai pengguna non-root `openclaw` agar state berada di bawah `/home/openclaw/.openclaw/` dan Gateway dipasang sebagai layanan systemd milik pengguna tersebut.

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Wizard memandu Anda melalui autentikasi model, penyiapan channel, pembuatan token gateway, dan pemasangan daemon (systemd).

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    Gateway terikat ke loopback secara default. Pilih salah satu opsi ini.

    **Opsi A: Tunnel SSH (paling sederhana)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Lalu buka `http://localhost:18789`.

    **Opsi B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Lalu buka `https://<magicdns>/` dari perangkat apa pun di tailnet Anda.

    Tailscale Serve mengautentikasi lalu lintas UI Kontrol dan WebSocket melalui header identitas tailnet, yang mengasumsikan host gateway itu sendiri tepercaya. Endpoint HTTP API tetap mengikuti mode autentikasi normal gateway (token/kata sandi). Untuk mewajibkan kredensial rahasia bersama eksplisit melalui Serve, setel `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

    **Opsi C: Bind tailnet (tanpa Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Lalu buka `http://<tailscale-ip>:18789` (token diperlukan).

  </Step>
</Steps>

## Persistensi dan cadangan

State OpenClaw berada di bawah:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/provider, dan data sesi.
- `~/.openclaw/workspace/` — workspace agen (SOUL.md, memori, artefak).

Ini bertahan setelah Droplet reboot. Untuk mengambil snapshot portabel:

```bash
openclaw backup create
```

Snapshot DigitalOcean mencadangkan seluruh Droplet; `openclaw backup create` portabel lintas host.

## Tips RAM 1 GB

Droplet $6 hanya memiliki RAM 1 GB. Agar semuanya tetap lancar:

- Pastikan langkah swap di atas ada di `/etc/fstab` agar bertahan setelah reboot.
- Pilih model berbasis API (Claude, GPT) daripada model lokal — inferensi LLM lokal tidak muat di 1 GB.
- Setel `agents.defaults.model.primary` ke model yang lebih kecil jika Anda mengalami OOM pada prompt besar.
- Pantau dengan `free -h` dan `htop`.

## Pemecahan masalah

**Gateway tidak bisa dimulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Port sudah digunakan** -- Jalankan `lsof -i :18789` untuk menemukan prosesnya, lalu hentikan.

**Kehabisan memori** -- Verifikasi swap aktif dengan `free -h`. Jika masih mengalami OOM, gunakan model berbasis API (Claude, GPT) alih-alih model lokal, atau tingkatkan ke Droplet 2 GB.

## Langkah berikutnya

- [Channel](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Memperbarui](/id/install/updating) -- jaga OpenClaw tetap mutakhir

## Terkait

- [Ringkasan instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
- [Hosting VPS](/id/vps)
