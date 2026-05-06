---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari VPS berbayar sederhana untuk OpenClaw
summary: Menjalankan OpenClaw di Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:16:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Jalankan OpenClaw Gateway persisten pada DigitalOcean Droplet (~$6/bulan untuk paket Basic 1 GB).

DigitalOcean adalah jalur VPS berbayar yang paling sederhana. Jika Anda lebih memilih opsi yang lebih murah atau gratis:

- [Hetzner](/id/install/hetzner) — €3,79/bln, lebih banyak core/RAM per dolar.
- [Oracle Cloud](/id/install/oracle) — Always Free ARM (hingga 4 OCPU, RAM 24 GB), tetapi pendaftaran bisa agak rumit dan hanya ARM.

## Prasyarat

- Akun DigitalOcean ([daftar](https://cloud.digitalocean.com/registrations/new))
- Pasangan kunci SSH (atau bersedia menggunakan autentikasi kata sandi)
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
       - **Wilayah:** Paling dekat dengan Anda
       - **Image:** Ubuntu 24.04 LTS
       - **Ukuran:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
       - **Autentikasi:** Kunci SSH (direkomendasikan) atau kata sandi
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

    Wizard memandu Anda melalui autentikasi model, penyiapan channel, pembuatan token gateway, dan instalasi daemon (systemd).

  </Step>

  <Step title="Tambahkan swap (direkomendasikan untuk Droplet 1 GB)">
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
    Gateway terikat ke loopback secara default. Pilih salah satu opsi berikut.

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

    Tailscale Serve mengautentikasi UI Kontrol dan traffic WebSocket melalui header identitas tailnet, yang mengasumsikan host gateway itu sendiri tepercaya. Endpoint HTTP API tetap mengikuti mode autentikasi normal gateway (token/kata sandi). Untuk mewajibkan kredensial shared-secret eksplisit melalui Serve, tetapkan `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

    **Opsi C: Bind tailnet (tanpa Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Lalu buka `http://<tailscale-ip>:18789` (token wajib).

  </Step>
</Steps>

## Persistensi dan cadangan

Status OpenClaw berada di bawah:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, status channel/provider, dan data sesi.
- `~/.openclaw/workspace/` — workspace agen (SOUL.md, memori, artefak).

Ini tetap bertahan setelah reboot Droplet. Untuk membuat snapshot portabel:

```bash
openclaw backup create
```

Snapshot DigitalOcean mencadangkan seluruh Droplet; `openclaw backup create` portabel lintas host.

## Tips RAM 1 GB

Droplet $6 hanya memiliki RAM 1 GB. Agar semuanya tetap lancar:

- Pastikan langkah swap di atas ada di `/etc/fstab` agar tetap bertahan setelah reboot.
- Lebih pilih model berbasis API (Claude, GPT) daripada model lokal — inferensi LLM lokal tidak muat dalam 1 GB.
- Tetapkan `agents.defaults.model.primary` ke model yang lebih kecil jika Anda mengalami OOM pada prompt besar.
- Pantau dengan `free -h` dan `htop`.

## Pemecahan masalah

**Gateway tidak dapat dimulai** -- Jalankan `openclaw doctor --non-interactive` dan periksa log dengan `journalctl --user -u openclaw-gateway.service -n 50`.

**Port sudah digunakan** -- Jalankan `lsof -i :18789` untuk menemukan prosesnya, lalu hentikan.

**Kehabisan memori** -- Verifikasi swap aktif dengan `free -h`. Jika masih mengalami OOM, gunakan model berbasis API (Claude, GPT) daripada model lokal, atau tingkatkan ke Droplet 2 GB.

## Langkah berikutnya

- [Channel](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Memperbarui](/id/install/updating) -- jaga OpenClaw tetap terbaru

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
- [Hosting VPS](/id/vps)
