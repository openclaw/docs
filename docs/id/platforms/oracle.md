---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS berbiaya rendah untuk OpenClaw
    - Ingin menjalankan OpenClaw 24/7 di server kecil
summary: OpenClaw di Oracle Cloud (Always Free ARM)
title: Oracle Cloud (platform)
x-i18n:
    generated_at: "2026-04-30T09:59:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw di Oracle Cloud (OCI)

## Tujuan

Menjalankan OpenClaw Gateway persisten di tier ARM **Always Free** Oracle Cloud.

Tier gratis Oracle bisa sangat cocok untuk OpenClaw (terutama jika Anda sudah memiliki akun OCI), tetapi ada beberapa kompromi:

- Arsitektur ARM (sebagian besar berjalan, tetapi beberapa biner mungkin hanya x86)
- Kapasitas dan pendaftaran bisa kurang stabil

## Perbandingan biaya (2026)

| Penyedia     | Paket           | Spesifikasi           | Harga/bln | Catatan                  |
| ------------ | --------------- | --------------------- | --------- | ------------------------ |
| Oracle Cloud | Always Free ARM | hingga 4 OCPU, RAM 24GB | $0        | ARM, kapasitas terbatas  |
| Hetzner      | CX22            | 2 vCPU, RAM 4GB       | ~ $4      | Opsi berbayar termurah   |
| DigitalOcean | Basic           | 1 vCPU, RAM 1GB       | $6        | UI mudah, dokumentasi baik |
| Vultr        | Cloud Compute   | 1 vCPU, RAM 1GB       | $6        | Banyak lokasi            |
| Linode       | Nanode          | 1 vCPU, RAM 1GB       | $5        | Kini bagian dari Akamai  |

---

## Prasyarat

- Akun Oracle Cloud ([daftar](https://www.oracle.com/cloud/free/)) — lihat [panduan pendaftaran komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika Anda mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- ~30 menit

## 1) Buat Instance OCI

1. Masuk ke [Oracle Cloud Console](https://cloud.oracle.com/)
2. Buka **Compute → Instances → Create Instance**
3. Konfigurasikan:
   - **Nama:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2 (atau hingga 4)
   - **Memori:** 12 GB (atau hingga 24 GB)
   - **Volume boot:** 50 GB (hingga 200 GB gratis)
   - **Kunci SSH:** Tambahkan kunci publik Anda
4. Klik **Create**
5. Catat alamat IP publik

**Tip:** Jika pembuatan instance gagal dengan "Out of capacity", coba domain ketersediaan lain atau coba lagi nanti. Kapasitas tier gratis terbatas.

## 2) Hubungkan dan Perbarui

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Catatan:** `build-essential` diperlukan untuk kompilasi ARM pada beberapa dependensi.

## 3) Konfigurasikan Pengguna dan Hostname

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instal Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Ini mengaktifkan SSH Tailscale, sehingga Anda dapat terhubung melalui `ssh openclaw` dari perangkat apa pun di tailnet Anda — tanpa perlu IP publik.

Verifikasi:

```bash
tailscale status
```

**Mulai sekarang, hubungkan melalui Tailscale:** `ssh ubuntu@openclaw` (atau gunakan IP Tailscale).

## 5) Instal OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Saat diminta "How do you want to hatch your bot?", pilih **"Do this later"**.

> Catatan: Jika Anda mengalami masalah build native ARM, mulai dengan paket sistem (misalnya `sudo apt install -y build-essential`) sebelum mencoba Homebrew.

## 6) Konfigurasikan Gateway (loopback + autentikasi token) dan aktifkan Tailscale Serve

Gunakan autentikasi token sebagai default. Ini mudah diprediksi dan menghindari kebutuhan flag Control UI “insecure auth”.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/local-client milik proxy Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute penampil diff tetap mempertahankan perilaku fail-closed dalam penyiapan ini: permintaan penampil mentah `127.0.0.1` tanpa header proxy terusan dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan penampil jarak jauh secara sengaja dan tetapkan `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan `baseUrl` proxy) jika Anda memerlukan tautan penampil yang dapat dibagikan.

## 7) Verifikasi

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Kunci Keamanan VCN

Setelah semuanya berjalan, kunci VCN untuk memblokir semua lalu lintas kecuali Tailscale. Virtual Cloud Network OCI bertindak sebagai firewall di tepi jaringan — lalu lintas diblokir sebelum mencapai instance Anda.

1. Buka **Networking → Virtual Cloud Networks** di OCI Console
2. Klik VCN Anda → **Security Lists** → Default Security List
3. **Hapus** semua aturan ingress kecuali:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Pertahankan aturan egress default (izinkan semua keluar)

Ini memblokir SSH pada port 22, HTTP, HTTPS, dan semua yang lain di tepi jaringan. Mulai sekarang, Anda hanya dapat terhubung melalui Tailscale.

---

## Akses Control UI

Dari perangkat apa pun di jaringan Tailscale Anda:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ganti `<tailnet-name>` dengan nama tailnet Anda (terlihat di `tailscale status`).

Tidak perlu tunnel SSH. Tailscale menyediakan:

- Enkripsi HTTPS (sertifikat otomatis)
- Autentikasi melalui identitas Tailscale
- Akses dari perangkat apa pun di tailnet Anda (laptop, ponsel, dll.)

---

## Keamanan: VCN + Tailscale (baseline yang direkomendasikan)

Dengan VCN dikunci (hanya UDP 41641 yang terbuka) dan Gateway diikat ke loopback, Anda mendapatkan pertahanan berlapis yang kuat: lalu lintas publik diblokir di tepi jaringan, dan akses admin terjadi melalui tailnet Anda.

Penyiapan ini sering menghilangkan _kebutuhan_ akan aturan firewall tambahan berbasis host hanya untuk menghentikan brute force SSH dari seluruh Internet — tetapi Anda tetap harus menjaga OS tetap diperbarui, menjalankan `openclaw security audit`, dan memverifikasi bahwa Anda tidak secara tidak sengaja mendengarkan di antarmuka publik.

### Sudah terlindungi

| Langkah Tradisional | Diperlukan? | Alasan                                                                      |
| ------------------- | ----------- | --------------------------------------------------------------------------- |
| Firewall UFW        | Tidak       | VCN memblokir sebelum lalu lintas mencapai instance                         |
| fail2ban            | Tidak       | Tidak ada brute force jika port 22 diblokir di VCN                          |
| Pengerasan sshd     | Tidak       | SSH Tailscale tidak menggunakan sshd                                        |
| Nonaktifkan login root | Tidak    | Tailscale menggunakan identitas Tailscale, bukan pengguna sistem            |
| Autentikasi hanya kunci SSH | Tidak | Tailscale mengautentikasi melalui tailnet Anda                              |
| Pengerasan IPv6     | Biasanya tidak | Bergantung pada pengaturan VCN/subnet Anda; verifikasi apa yang benar-benar ditetapkan/terekspos |

### Tetap direkomendasikan

- **Izin kredensial:** `chmod 700 ~/.openclaw`
- **Audit keamanan:** `openclaw security audit`
- **Pembaruan sistem:** `sudo apt update && sudo apt upgrade` secara rutin
- **Pantau Tailscale:** Tinjau perangkat di [konsol admin Tailscale](https://login.tailscale.com/admin)

### Verifikasi postur keamanan

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Fallback: Tunnel SSH

Jika Tailscale Serve tidak berfungsi, gunakan tunnel SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Lalu buka `http://localhost:18789`.

---

## Pemecahan Masalah

### Pembuatan instance gagal ("Out of capacity")

Instance ARM tier gratis populer. Coba:

- Domain ketersediaan yang berbeda
- Coba lagi saat jam sepi (pagi hari)
- Gunakan filter "Always Free" saat memilih shape

### Tailscale tidak dapat terhubung

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway tidak dapat dimulai

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Tidak dapat menjangkau Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Masalah biner ARM

Beberapa alat mungkin tidak memiliki build ARM. Periksa:

```bash
uname -m  # Should show aarch64
```

Sebagian besar paket npm berjalan baik. Untuk biner, cari rilis `linux-arm64` atau `aarch64`.

---

## Persistensi

Semua state berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/provider, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memori, artefak)

Cadangkan secara berkala:

```bash
openclaw backup create
```

---

## Terkait

- [Akses jarak jauh Gateway](/id/gateway/remote) — pola akses jarak jauh lainnya
- [Integrasi Tailscale](/id/gateway/tailscale) — dokumentasi lengkap Tailscale
- [Konfigurasi Gateway](/id/gateway/configuration) — semua opsi konfigurasi
- [Panduan DigitalOcean](/id/install/digitalocean) — jika Anda menginginkan berbayar + pendaftaran lebih mudah
- [Panduan Hetzner](/id/install/hetzner) — alternatif berbasis Docker
