---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari hosting VPS murah untuk OpenClaw
summary: OpenClaw di DigitalOcean (opsi VPS berbayar sederhana)
title: DigitalOcean (platform)
x-i18n:
    generated_at: "2026-04-24T09:16:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw di DigitalOcean

## Tujuan

Jalankan Gateway OpenClaw persisten di DigitalOcean dengan biaya **$6/bulan** (atau $4/bln dengan harga reserved).

Jika Anda menginginkan opsi $0/bulan dan tidak keberatan dengan ARM + penyiapan spesifik provider, lihat [panduan Oracle Cloud](/id/install/oracle).

## Perbandingan biaya (2026)

| Provider     | Plan            | Specs                  | Harga/bln   | Catatan                              |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------ |
| Oracle Cloud | Always Free ARM | hingga 4 OCPU, 24GB RAM | $0         | ARM, kapasitas terbatas / kendala pendaftaran |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | Opsi berbayar termurah               |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | UI mudah, dokumentasi bagus          |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Banyak lokasi                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Kini bagian dari Akamai              |

**Memilih provider:**

- DigitalOcean: UX paling sederhana + penyiapan yang dapat diprediksi (panduan ini)
- Hetzner: harga/performa bagus (lihat [panduan Hetzner](/id/install/hetzner))
- Oracle Cloud: bisa $0/bulan, tetapi lebih rewel dan hanya ARM (lihat [panduan Oracle](/id/install/oracle))

---

## Prasyarat

- Akun DigitalOcean ([daftar dengan kredit gratis $200](https://m.do.co/c/signup))
- Pasangan SSH key (atau bersedia menggunakan auth kata sandi)
- ~20 menit

## 1) Buat Droplet

<Warning>
Gunakan base image yang bersih (Ubuntu 24.04 LTS). Hindari image 1-klik Marketplace pihak ketiga kecuali Anda telah meninjau skrip startup dan default firewall-nya.
</Warning>

1. Login ke [DigitalOcean](https://cloud.digitalocean.com/)
2. Klik **Create → Droplets**
3. Pilih:
   - **Region:** Yang paling dekat dengan Anda (atau pengguna Anda)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/bln** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH key (disarankan) atau kata sandi
4. Klik **Create Droplet**
5. Catat alamat IP-nya

## 2) Sambungkan via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instal OpenClaw

```bash
# Perbarui sistem
apt update && apt upgrade -y

# Instal Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Instal OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verifikasi
openclaw --version
```

## 4) Jalankan onboarding

```bash
openclaw onboard --install-daemon
```

Wizard akan memandu Anda melalui:

- Auth model (API key atau OAuth)
- Penyiapan channel (Telegram, WhatsApp, Discord, dll.)
- Token Gateway (dibuat otomatis)
- Instalasi daemon (systemd)

## 5) Verifikasi Gateway

```bash
# Periksa status
openclaw status

# Periksa service
systemctl --user status openclaw-gateway.service

# Lihat log
journalctl --user -u openclaw-gateway.service -f
```

## 6) Akses Dashboard

Gateway bind ke loopback secara default. Untuk mengakses Control UI:

**Opsi A: SSH Tunnel (disarankan)**

```bash
# Dari mesin lokal Anda
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Lalu buka: http://localhost:18789
```

**Opsi B: Tailscale Serve (HTTPS, hanya loopback)**

```bash
# Di droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Konfigurasikan Gateway untuk menggunakan Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Buka: `https://<magicdns>/`

Catatan:

- Serve menjaga Gateway tetap hanya-loopback dan mengautentikasi lalu lintas Control UI/WebSocket melalui header identitas Tailscale (auth tanpa token mengasumsikan host gateway tepercaya; API HTTP tidak menggunakan header Tailscale tersebut dan sebaliknya mengikuti mode auth HTTP normal gateway).
- Untuk mewajibkan kredensial shared-secret eksplisit, setel `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

**Opsi C: Bind tailnet (tanpa Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Buka: `http://<tailscale-ip>:18789` (token diperlukan).

## 7) Hubungkan channel Anda

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Pindai kode QR
```

Lihat [Channels](/id/channels) untuk provider lain.

---

## Optimasi untuk RAM 1GB

Droplet $6 hanya memiliki RAM 1GB. Agar semuanya tetap berjalan lancar:

### Tambahkan swap (disarankan)

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
- Menyetel `agents.defaults.model.primary` ke model yang lebih kecil

### Pantau memori

```bash
free -h
htop
```

---

## Persistensi

Semua status berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, status channel/provider, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory, dll.)

Semua ini bertahan setelah reboot. Cadangkan secara berkala:

```bash
openclaw backup create
```

---

## Alternatif gratis Oracle Cloud

Oracle Cloud menawarkan instance ARM **Always Free** yang jauh lebih kuat daripada opsi berbayar mana pun di sini — dengan biaya $0/bulan.

| Yang Anda dapatkan | Specs                 |
| ------------------ | --------------------- |
| **4 OCPU**         | ARM Ampere A1         |
| **24GB RAM**       | Lebih dari cukup      |
| **200GB storage**  | Block volume          |
| **Gratis selamanya** | Tanpa biaya kartu kredit |

**Catatan:**

- Pendaftaran bisa rewel (coba lagi jika gagal)
- Arsitektur ARM — sebagian besar hal berfungsi, tetapi beberapa biner memerlukan build ARM

Untuk panduan penyiapan lengkap, lihat [Oracle Cloud](/id/install/oracle). Untuk tips pendaftaran dan pemecahan masalah proses pendaftaran, lihat [panduan komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) ini.

---

## Pemecahan masalah

### Gateway tidak mau mulai

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
# Periksa memori
free -h

# Tambahkan swap lagi
# Atau upgrade ke droplet $12/bln (RAM 2GB)
```

---

## Terkait

- [Panduan Hetzner](/id/install/hetzner) — lebih murah, lebih bertenaga
- [Instalasi Docker](/id/install/docker) — penyiapan dalam container
- [Tailscale](/id/gateway/tailscale) — akses remote yang aman
- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi lengkap
