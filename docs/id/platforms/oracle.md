---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS berbiaya rendah untuk OpenClaw
    - Ingin OpenClaw berjalan 24/7 di server kecil
summary: OpenClaw di Oracle Cloud (Always Free ARM)
title: Oracle Cloud (Platform)
x-i18n:
    generated_at: "2026-04-05T14:01:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw di Oracle Cloud (OCI)

## Tujuan

Jalankan OpenClaw Gateway persisten di tier ARM **Always Free** milik Oracle Cloud.

Tier gratis Oracle bisa sangat cocok untuk OpenClaw (terutama jika Anda sudah memiliki akun OCI), tetapi ada beberapa tradeoff:

- Arsitektur ARM (sebagian besar berjalan, tetapi beberapa biner mungkin hanya x86)
- Kapasitas dan pendaftaran bisa sedikit sulit

## Perbandingan Biaya (2026)

| Penyedia     | Paket           | Spesifikasi            | Harga/bln | Catatan               |
| ------------ | --------------- | ---------------------- | --------- | --------------------- |
| Oracle Cloud | Always Free ARM | hingga 4 OCPU, 24GB RAM | $0        | ARM, kapasitas terbatas |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4      | Opsi berbayar termurah |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6        | UI mudah, dokumentasi bagus |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6        | Banyak lokasi         |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5        | Kini bagian dari Akamai |

---

## Prasyarat

- Akun Oracle Cloud ([signup](https://www.oracle.com/cloud/free/)) — lihat [panduan signup komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika Anda mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- ~30 menit

## 1) Buat Instance OCI

1. Masuk ke [Oracle Cloud Console](https://cloud.oracle.com/)
2. Buka **Compute → Instances → Create Instance**
3. Konfigurasikan:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (atau hingga 4)
   - **Memory:** 12 GB (atau hingga 24 GB)
   - **Boot volume:** 50 GB (hingga 200 GB gratis)
   - **SSH key:** Tambahkan public key Anda
4. Klik **Create**
5. Catat alamat IP publik

**Tip:** Jika pembuatan instance gagal dengan "Out of capacity", coba availability domain lain atau coba lagi nanti. Kapasitas tier gratis terbatas.

## 2) Hubungkan dan Perbarui

```bash
# Hubungkan melalui IP publik
ssh ubuntu@YOUR_PUBLIC_IP

# Perbarui sistem
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Catatan:** `build-essential` diperlukan untuk kompilasi ARM beberapa dependensi.

## 3) Konfigurasikan Pengguna dan Hostname

```bash
# Atur hostname
sudo hostnamectl set-hostname openclaw

# Atur kata sandi untuk pengguna ubuntu
sudo passwd ubuntu

# Aktifkan lingering (menjaga layanan pengguna tetap berjalan setelah logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instal Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Ini mengaktifkan Tailscale SSH, sehingga Anda dapat terhubung melalui `ssh openclaw` dari perangkat mana pun di tailnet Anda — tanpa memerlukan IP publik.

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

Saat ditanya "How do you want to hatch your bot?", pilih **"Do this later"**.

> Catatan: Jika Anda mengalami masalah build native ARM, mulai dengan paket sistem (misalnya `sudo apt install -y build-essential`) sebelum menggunakan Homebrew.

## 6) Konfigurasikan Gateway (loopback + auth token) dan aktifkan Tailscale Serve

Gunakan auth token sebagai default. Ini dapat diprediksi dan menghindari perlunya flag UI Kontrol “insecure auth”.

```bash
# Jaga Gateway tetap privat di VM
openclaw config set gateway.bind loopback

# Wajibkan auth untuk Gateway + UI Kontrol
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Ekspos melalui Tailscale Serve (HTTPS + akses tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/local-client proxy Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute diff viewer tetap mempertahankan perilaku fail-closed dalam setup ini: permintaan viewer mentah `127.0.0.1` tanpa header proxy yang diteruskan dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan viewer remote dengan sengaja dan setel `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan `baseUrl` proxy) jika Anda memerlukan tautan viewer yang dapat dibagikan.

## 7) Verifikasi

```bash
# Periksa versi
openclaw --version

# Periksa status daemon
systemctl --user status openclaw-gateway.service

# Periksa Tailscale Serve
tailscale serve status

# Uji respons lokal
curl http://localhost:18789
```

## 8) Kunci Keamanan VCN

Sekarang setelah semuanya berjalan, kunci VCN untuk memblokir semua lalu lintas kecuali Tailscale. Virtual Cloud Network OCI bertindak sebagai firewall di tepi jaringan — lalu lintas diblokir sebelum mencapai instance Anda.

1. Buka **Networking → Virtual Cloud Networks** di OCI Console
2. Klik VCN Anda → **Security Lists** → Default Security List
3. **Hapus** semua aturan ingress kecuali:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Pertahankan aturan egress default (izinkan semua lalu lintas keluar)

Ini memblokir SSH di port 22, HTTP, HTTPS, dan semua hal lainnya di tepi jaringan. Mulai sekarang, Anda hanya dapat terhubung melalui Tailscale.

---

## Akses UI Kontrol

Dari perangkat mana pun di jaringan Tailscale Anda:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ganti `<tailnet-name>` dengan nama tailnet Anda (terlihat di `tailscale status`).

Tidak perlu tunnel SSH. Tailscale menyediakan:

- Enkripsi HTTPS (sertifikat otomatis)
- Autentikasi melalui identitas Tailscale
- Akses dari perangkat mana pun di tailnet Anda (laptop, ponsel, dll.)

---

## Keamanan: VCN + Tailscale (baseline yang direkomendasikan)

Dengan VCN terkunci (hanya UDP 41641 yang terbuka) dan Gateway bind ke loopback, Anda mendapatkan defense-in-depth yang kuat: lalu lintas publik diblokir di tepi jaringan, dan akses admin terjadi melalui tailnet Anda.

Setup ini sering menghilangkan _kebutuhan_ akan aturan firewall berbasis host tambahan semata-mata untuk menghentikan brute force SSH dari Internet luas — tetapi Anda tetap harus menjaga OS tetap diperbarui, menjalankan `openclaw security audit`, dan memverifikasi bahwa Anda tidak sengaja mendengarkan di antarmuka publik.

### Sudah terlindungi

| Langkah tradisional | Perlu?      | Mengapa                                                                      |
| ------------------- | ----------- | ---------------------------------------------------------------------------- |
| Firewall UFW        | Tidak       | VCN memblokir sebelum lalu lintas mencapai instance                          |
| fail2ban            | Tidak       | Tidak ada brute force jika port 22 diblokir di VCN                           |
| Hardening sshd      | Tidak       | Tailscale SSH tidak menggunakan sshd                                         |
| Nonaktifkan login root | Tidak    | Tailscale menggunakan identitas Tailscale, bukan pengguna sistem             |
| Auth khusus kunci SSH | Tidak     | Tailscale mengautentikasi melalui tailnet Anda                               |
| Hardening IPv6      | Biasanya tidak | Bergantung pada pengaturan VCN/subnet Anda; verifikasi apa yang benar-benar ditetapkan/diekspos |

### Tetap Direkomendasikan

- **Izin kredensial:** `chmod 700 ~/.openclaw`
- **Audit keamanan:** `openclaw security audit`
- **Pembaruan sistem:** `sudo apt update && sudo apt upgrade` secara berkala
- **Pantau Tailscale:** Tinjau perangkat di [konsol admin Tailscale](https://login.tailscale.com/admin)

### Verifikasi Postur Keamanan

```bash
# Pastikan tidak ada port publik yang mendengarkan
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifikasi Tailscale SSH aktif
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opsional: nonaktifkan sshd sepenuhnya
sudo systemctl disable --now ssh
```

---

## Fallback: Tunnel SSH

Jika Tailscale Serve tidak berfungsi, gunakan tunnel SSH:

```bash
# Dari mesin lokal Anda (melalui Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Lalu buka `http://localhost:18789`.

---

## Pemecahan masalah

### Pembuatan instance gagal ("Out of capacity")

Instance ARM tier gratis populer. Coba:

- Availability domain yang berbeda
- Coba lagi di jam sepi (pagi-pagi)
- Gunakan filter "Always Free" saat memilih shape

### Tailscale tidak mau terhubung

```bash
# Periksa status
sudo tailscale status

# Autentikasi ulang
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway tidak mau start

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Tidak bisa menjangkau UI Kontrol

```bash
# Verifikasi Tailscale Serve berjalan
tailscale serve status

# Periksa gateway sedang mendengarkan
curl http://localhost:18789

# Restart jika perlu
systemctl --user restart openclaw-gateway.service
```

### Masalah biner ARM

Beberapa tool mungkin tidak memiliki build ARM. Periksa:

```bash
uname -m  # Seharusnya menampilkan aarch64
```

Sebagian besar paket npm berfungsi dengan baik. Untuk biner, cari rilis `linux-arm64` atau `aarch64`.

---

## Persistensi

Semua state berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/provider, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memori, artefak)

Lakukan backup secara berkala:

```bash
openclaw backup create
```

---

## Lihat Juga

- [Akses jarak jauh Gateway](/id/gateway/remote) — pola akses jarak jauh lainnya
- [Integrasi Tailscale](/id/gateway/tailscale) — dokumentasi Tailscale lengkap
- [Konfigurasi Gateway](/id/gateway/configuration) — semua opsi konfigurasi
- [Panduan DigitalOcean](/platforms/digitalocean) — jika Anda menginginkan opsi berbayar + signup lebih mudah
- [Panduan Hetzner](/install/hetzner) — alternatif berbasis Docker
