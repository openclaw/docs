---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari hosting VPS murah untuk OpenClaw
summary: OpenClaw di DigitalOcean (opsi VPS berbayar sederhana)
title: DigitalOcean (platform)
x-i18n:
    generated_at: "2026-04-30T09:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw di DigitalOcean

## Tujuan

Jalankan OpenClaw Gateway persisten di DigitalOcean seharga **$6/bulan** (atau $4/bln dengan harga reserved).

Jika Anda menginginkan opsi $0/bulan dan tidak keberatan dengan ARM + penyiapan khusus penyedia, lihat [panduan Oracle Cloud](/id/install/oracle).

## Perbandingan biaya (2026)

| Penyedia     | Paket           | Spesifikasi            | Harga/bln   | Catatan                               |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | hingga 4 OCPU, RAM 24GB | $0          | ARM, kapasitas terbatas / keunikan pendaftaran |
| Hetzner      | CX22            | 2 vCPU, RAM 4GB        | €3.79 (~$4) | Opsi berbayar termurah                |
| DigitalOcean | Basic           | 1 vCPU, RAM 1GB        | $6          | UI mudah, dokumentasi bagus           |
| Vultr        | Cloud Compute   | 1 vCPU, RAM 1GB        | $6          | Banyak lokasi                         |
| Linode       | Nanode          | 1 vCPU, RAM 1GB        | $5          | Sekarang bagian dari Akamai           |

**Memilih penyedia:**

- DigitalOcean: UX paling sederhana + penyiapan yang dapat diprediksi (panduan ini)
- Hetzner: harga/performa bagus (lihat [panduan Hetzner](/id/install/hetzner))
- Oracle Cloud: bisa $0/bulan, tetapi lebih rewel dan hanya ARM (lihat [panduan Oracle](/id/install/oracle))

---

## Prasyarat

- Akun DigitalOcean ([daftar dengan kredit gratis $200](https://m.do.co/c/signup))
- Pasangan kunci SSH (atau bersedia menggunakan autentikasi kata sandi)
- ~20 menit

## 1) Buat Droplet

<Warning>
Gunakan image dasar yang bersih (Ubuntu 24.04 LTS). Hindari image 1-klik Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan default firewall-nya.
</Warning>

1. Masuk ke [DigitalOcean](https://cloud.digitalocean.com/)
2. Klik **Create → Droplets**
3. Pilih:
   - **Wilayah:** Yang terdekat dengan Anda (atau pengguna Anda)
   - **Image:** Ubuntu 24.04 LTS
   - **Ukuran:** Basic → Regular → **$6/bln** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Autentikasi:** Kunci SSH (direkomendasikan) atau kata sandi
4. Klik **Create Droplet**
5. Catat alamat IP

## 2) Hubungkan melalui SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instal OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Jalankan Onboarding

```bash
openclaw onboard --install-daemon
```

Wizard akan memandu Anda melalui:

- Autentikasi model (kunci API atau OAuth)
- Penyiapan channel (Telegram, WhatsApp, Discord, dll.)
- Token Gateway (dibuat otomatis)
- Instalasi daemon (systemd)

## 5) Verifikasi Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Akses Dashboard

Gateway terikat ke loopback secara default. Untuk mengakses UI Kontrol:

**Opsi A: Tunnel SSH (direkomendasikan)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opsi B: Tailscale Serve (HTTPS, hanya loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Buka: `https://<magicdns>/`

Catatan:

- Serve menjaga Gateway tetap hanya loopback dan mengautentikasi lalu lintas UI Kontrol/WebSocket melalui header identitas Tailscale (autentikasi tanpa token mengasumsikan host gateway tepercaya; API HTTP tidak menggunakan header Tailscale tersebut dan mengikuti mode autentikasi HTTP normal gateway).
- Untuk mewajibkan kredensial rahasia bersama secara eksplisit sebagai gantinya, atur `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

**Opsi C: Bind tailnet (tanpa Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Buka: `http://<tailscale-ip>:18789` (token diperlukan).

## 7) Hubungkan Channel Anda

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Lihat [Channel](/id/channels) untuk penyedia lain.

---

## Optimisasi untuk RAM 1GB

Droplet $6 hanya memiliki RAM 1GB. Agar semuanya berjalan lancar:

### Tambahkan swap (direkomendasikan)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Gunakan model yang lebih ringan

Jika Anda mengalami OOM, pertimbangkan:

- Menggunakan model berbasis API (Claude, GPT) alih-alih model lokal
- Mengatur `agents.defaults.model.primary` ke model yang lebih kecil

### Pantau memori

```bash
free -h
htop
```

---

## Persistensi

Semua status berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, status channel/penyedia, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memori, dll.)

Ini tetap ada setelah reboot. Cadangkan secara berkala:

```bash
openclaw backup create
```

---

## Alternatif gratis Oracle Cloud

Oracle Cloud menawarkan instans ARM **Always Free** yang jauh lebih kuat daripada opsi berbayar mana pun di sini — seharga $0/bulan.

| Yang Anda dapatkan | Spesifikasi            |
| ------------------ | ---------------------- |
| **4 OCPU**         | ARM Ampere A1          |
| **RAM 24GB**       | Lebih dari cukup       |
| **Penyimpanan 200GB** | Volume blok          |
| **Gratis selamanya** | Tidak ada tagihan kartu kredit |

**Catatan penting:**

- Pendaftaran bisa rewel (coba lagi jika gagal)
- Arsitektur ARM — sebagian besar hal berfungsi, tetapi beberapa biner memerlukan build ARM

Untuk panduan penyiapan lengkap, lihat [Oracle Cloud](/id/install/oracle). Untuk tips pendaftaran dan pemecahan masalah proses enrollment, lihat [panduan komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) ini.

---

## Pemecahan Masalah

### Gateway tidak dapat dimulai

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port sudah digunakan

```bash
lsof -i :18789
kill <PID>
```

### Kehabisan memori

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Terkait

- [Panduan Hetzner](/id/install/hetzner) — lebih murah, lebih kuat
- [Instal Docker](/id/install/docker) — penyiapan berbasis container
- [Tailscale](/id/gateway/tailscale) — akses jarak jauh yang aman
- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi lengkap
