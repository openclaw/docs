---
read_when:
    - Menyiapkan OpenClaw di DigitalOcean
    - Mencari hosting VPS murah untuk OpenClaw
summary: OpenClaw di DigitalOcean (opsi VPS berbayar yang sederhana)
title: DigitalOcean (Platform)
x-i18n:
    generated_at: "2026-04-05T14:00:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw di DigitalOcean

## Tujuan

Jalankan Gateway OpenClaw yang persisten di DigitalOcean dengan biaya **$6/bulan** (atau $4/bulan dengan harga reservasi).

Jika Anda menginginkan opsi $0/bulan dan tidak keberatan dengan ARM + penyiapan khusus provider, lihat [panduan Oracle Cloud](/platforms/oracle).

## Perbandingan Biaya (2026)

| Provider     | Plan            | Specs                  | Price/mo    | Notes                                 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | hingga 4 OCPU, RAM 24GB | $0          | ARM, kapasitas terbatas / kendala signup |
| Hetzner      | CX22            | 2 vCPU, RAM 4GB        | €3.79 (~$4) | Opsi berbayar termurah                |
| DigitalOcean | Basic           | 1 vCPU, RAM 1GB        | $6          | UI mudah, dokumentasi bagus           |
| Vultr        | Cloud Compute   | 1 vCPU, RAM 1GB        | $6          | Banyak lokasi                         |
| Linode       | Nanode          | 1 vCPU, RAM 1GB        | $5          | Kini bagian dari Akamai               |

**Memilih provider:**

- DigitalOcean: UX paling sederhana + penyiapan yang dapat diprediksi (panduan ini)
- Hetzner: harga/performa bagus (lihat [panduan Hetzner](/install/hetzner))
- Oracle Cloud: bisa $0/bulan, tetapi lebih rewel dan hanya ARM (lihat [panduan Oracle](/platforms/oracle))

---

## Prasyarat

- Akun DigitalOcean ([signup dengan kredit gratis $200](https://m.do.co/c/signup))
- Pasangan SSH key (atau bersedia menggunakan autentikasi password)
- ~20 menit

## 1) Buat Droplet

<Warning>
Gunakan base image yang bersih (Ubuntu 24.04 LTS). Hindari image 1-click Marketplace pihak ketiga kecuali Anda sudah meninjau script startup dan default firewall mereka.
</Warning>

1. Login ke [DigitalOcean](https://cloud.digitalocean.com/)
2. Klik **Create → Droplets**
3. Pilih:
   - **Region:** Yang paling dekat dengan Anda (atau pengguna Anda)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Authentication:** SSH key (disarankan) atau password
4. Klik **Create Droplet**
5. Catat alamat IP-nya

## 2) Hubungkan via SSH

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

## 4) Jalankan Onboarding

```bash
openclaw onboard --install-daemon
```

Wizard akan memandu Anda melalui:

- Autentikasi model (API key atau OAuth)
- Penyiapan channel (Telegram, WhatsApp, Discord, dll.)
- Token gateway (dibuat otomatis)
- Instalasi daemon (systemd)

## 5) Verifikasi Gateway

```bash
# Periksa status
openclaw status

# Periksa layanan
systemctl --user status openclaw-gateway.service

# Lihat log
journalctl --user -u openclaw-gateway.service -f
```

## 6) Akses Dashboard

Gateway secara default bind ke loopback. Untuk mengakses Control UI:

**Opsi A: Tunnel SSH (disarankan)**

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

- Serve menjaga Gateway tetap hanya loopback dan mengautentikasi traffic Control UI/WebSocket melalui header identitas Tailscale (autentikasi tanpa token mengasumsikan host gateway tepercaya; HTTP API tidak menggunakan header Tailscale tersebut dan sebagai gantinya mengikuti mode autentikasi HTTP normal gateway).
- Untuk mewajibkan kredensial shared secret secara eksplisit, tetapkan `gateway.auth.allowTailscale: false` dan gunakan `gateway.auth.mode: "token"` atau `"password"`.

**Opsi C: Bind tailnet (tanpa Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Buka: `http://<tailscale-ip>:18789` (memerlukan token).

## 7) Hubungkan Channel Anda

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

Lihat [Channels](/id/channels) untuk provider lainnya.

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
- Menetapkan `agents.defaults.model.primary` ke model yang lebih kecil

### Pantau memori

```bash
free -h
htop
```

---

## Persistensi

Semua state berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/provider, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memori, dll.)

Semua ini tetap ada setelah reboot. Cadangkan secara berkala:

```bash
openclaw backup create
```

---

## Alternatif Gratis Oracle Cloud

Oracle Cloud menawarkan instance ARM **Always Free** yang jauh lebih kuat daripada opsi berbayar mana pun di sini — dengan biaya $0/bulan.

| Yang Anda dapatkan | Specs                  |
| ------------------ | ---------------------- |
| **4 OCPU**         | ARM Ampere A1          |
| **RAM 24GB**       | Lebih dari cukup       |
| **Penyimpanan 200GB** | Volume blok         |
| **Gratis selamanya** | Tanpa biaya kartu kredit |

**Catatan:**

- Signup bisa agak rewel (coba lagi jika gagal)
- Arsitektur ARM — sebagian besar hal berfungsi, tetapi beberapa biner memerlukan build ARM

Untuk panduan penyiapan lengkap, lihat [Oracle Cloud](/platforms/oracle). Untuk tips signup dan pemecahan masalah proses pendaftaran, lihat [panduan komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) ini.

---

## Pemecahan masalah

### Gateway tidak mau start

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

# Tambahkan lebih banyak swap
# Atau upgrade ke droplet $12/mo (RAM 2GB)
```

---

## Lihat Juga

- [panduan Hetzner](/install/hetzner) — lebih murah, lebih bertenaga
- [instalasi Docker](/install/docker) — penyiapan dalam container
- [Tailscale](/id/gateway/tailscale) — akses jarak jauh yang aman
- [Konfigurasi](/id/gateway/configuration) — referensi konfigurasi lengkap
