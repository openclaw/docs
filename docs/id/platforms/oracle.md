---
read_when:
    - Menyiapkan OpenClaw di Oracle Cloud
    - Mencari hosting VPS berbiaya rendah untuk OpenClaw
    - Ingin OpenClaw 24/7 di server kecil
summary: OpenClaw di Oracle Cloud (Always Free ARM)
title: Oracle Cloud (platform)
x-i18n:
    generated_at: "2026-04-24T09:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw di Oracle Cloud (OCI)

## Tujuan

Menjalankan Gateway OpenClaw yang persisten di tier ARM **Always Free** milik Oracle Cloud.

Tier gratis Oracle bisa sangat cocok untuk OpenClaw (terutama jika Anda sudah memiliki akun OCI), tetapi ada komprominya:

- Arsitektur ARM (sebagian besar berjalan, tetapi beberapa binary mungkin hanya x86)
- Kapasitas dan pendaftaran bisa agak merepotkan

## Perbandingan Biaya (2026)

| Provider     | Paket            | Spesifikasi            | Harga/bln | Catatan               |
| ------------ | ---------------- | ---------------------- | --------- | --------------------- |
| Oracle Cloud | Always Free ARM  | hingga 4 OCPU, 24GB RAM | $0        | ARM, kapasitas terbatas |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM        | ~ $4      | Opsi berbayar termurah |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM        | $6        | UI mudah, dokumentasi bagus |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM        | $6        | Banyak lokasi         |
| Linode       | Nanode           | 1 vCPU, 1GB RAM        | $5        | Sekarang bagian dari Akamai |

---

## Prasyarat

- Akun Oracle Cloud ([signup](https://www.oracle.com/cloud/free/)) — lihat [panduan signup komunitas](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) jika Anda mengalami masalah
- Akun Tailscale (gratis di [tailscale.com](https://tailscale.com))
- ~30 menit

## 1) Buat instance OCI

1. Login ke [Oracle Cloud Console](https://cloud.oracle.com/)
2. Navigasi ke **Compute → Instances → Create Instance**
3. Konfigurasikan:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (atau hingga 4)
   - **Memory:** 12 GB (atau hingga 24 GB)
   - **Boot volume:** 50 GB (hingga 200 GB gratis)
   - **SSH key:** Tambahkan public key Anda
4. Klik **Create**
5. Catat alamat IP publiknya

**Tip:** Jika pembuatan instance gagal dengan "Out of capacity", coba availability domain lain atau coba lagi nanti. Kapasitas tier gratis terbatas.

## 2) Hubungkan dan perbarui

```bash
# Hubungkan melalui IP publik
ssh ubuntu@YOUR_PUBLIC_IP

# Perbarui sistem
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Catatan:** `build-essential` diperlukan untuk kompilasi ARM beberapa dependensi.

## 3) Konfigurasikan pengguna dan hostname

```bash
# Atur hostname
sudo hostnamectl set-hostname openclaw

# Atur password untuk pengguna ubuntu
sudo passwd ubuntu

# Aktifkan lingering (menjaga layanan pengguna tetap berjalan setelah logout)
sudo loginctl enable-linger ubuntu
```

## 4) Instal Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Ini mengaktifkan Tailscale SSH, sehingga Anda dapat terhubung melalui `ssh openclaw` dari perangkat mana pun di tailnet Anda — tanpa perlu IP publik.

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

> Catatan: Jika Anda mengalami masalah build native ARM, mulai dengan paket sistem (misalnya `sudo apt install -y build-essential`) sebelum beralih ke Homebrew.

## 6) Konfigurasikan Gateway (loopback + auth token) dan aktifkan Tailscale Serve

Gunakan auth token sebagai default. Ini dapat diprediksi dan menghindari kebutuhan akan flag Control UI “insecure auth”.

```bash
# Jaga Gateway tetap privat di VM
openclaw config set gateway.bind loopback

# Wajibkan auth untuk Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Ekspos melalui Tailscale Serve (HTTPS + akses tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` di sini hanya untuk penanganan forwarded-IP/local-client milik proxy Tailscale Serve lokal. Ini **bukan** `gateway.auth.mode: "trusted-proxy"`. Rute penampil diff tetap berperilaku fail-closed dalam penyiapan ini: permintaan penampil `127.0.0.1` mentah tanpa header proxy yang diteruskan dapat mengembalikan `Diff not found`. Gunakan `mode=file` / `mode=both` untuk lampiran, atau aktifkan penampil remote secara sengaja dan atur `plugins.entries.diffs.config.viewerBaseUrl` (atau berikan proxy `baseUrl`) jika Anda membutuhkan tautan penampil yang dapat dibagikan.

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

## 8) Kunci keamanan VCN

Sekarang setelah semuanya berfungsi, kunci VCN agar memblokir semua traffic kecuali Tailscale. Virtual Cloud Network OCI bertindak sebagai firewall di tepi jaringan — traffic diblokir sebelum mencapai instance Anda.

1. Buka **Networking → Virtual Cloud Networks** di OCI Console
2. Klik VCN Anda → **Security Lists** → Default Security List
3. **Hapus** semua aturan ingress kecuali:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Pertahankan aturan egress default (izinkan semua trafik keluar)

Ini memblokir SSH pada port 22, HTTP, HTTPS, dan semua yang lain di tepi jaringan. Mulai sekarang, Anda hanya dapat terhubung melalui Tailscale.

---

## Akses Control UI

Dari perangkat mana pun di jaringan Tailscale Anda:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ganti `<tailnet-name>` dengan nama tailnet Anda (terlihat di `tailscale status`).

Tidak perlu SSH tunnel. Tailscale menyediakan:

- Enkripsi HTTPS (sertifikat otomatis)
- Autentikasi melalui identitas Tailscale
- Akses dari perangkat mana pun di tailnet Anda (laptop, ponsel, dll.)

---

## Keamanan: VCN + Tailscale (baseline yang direkomendasikan)

Dengan VCN yang dikunci (hanya UDP 41641 yang terbuka) dan Gateway di-bind ke loopback, Anda mendapatkan pertahanan berlapis yang kuat: traffic publik diblokir di tepi jaringan, dan akses admin dilakukan melalui tailnet Anda.

Penyiapan ini sering kali menghilangkan _kebutuhan_ akan aturan firewall berbasis host tambahan hanya untuk menghentikan brute force SSH dari Internet — tetapi Anda tetap harus menjaga OS tetap mutakhir, menjalankan `openclaw security audit`, dan memastikan Anda tidak tanpa sengaja melakukan listen pada antarmuka publik.

### Sudah terlindungi

| Langkah tradisional   | Perlu?       | Alasan                                                                       |
| --------------------- | ------------ | ---------------------------------------------------------------------------- |
| Firewall UFW          | Tidak        | VCN memblokir sebelum traffic mencapai instance                              |
| fail2ban              | Tidak        | Tidak ada brute force jika port 22 diblokir di VCN                           |
| Hardening sshd        | Tidak        | Tailscale SSH tidak menggunakan sshd                                         |
| Nonaktifkan login root | Tidak       | Tailscale menggunakan identitas Tailscale, bukan pengguna sistem             |
| Auth SSH key-only     | Tidak        | Tailscale mengautentikasi melalui tailnet Anda                               |
| Hardening IPv6        | Biasanya tidak | Bergantung pada pengaturan VCN/subnet Anda; verifikasi apa yang benar-benar ditetapkan/diekspos |

### Masih direkomendasikan

- **Izin kredensial:** `chmod 700 ~/.openclaw`
- **Audit keamanan:** `openclaw security audit`
- **Pembaruan sistem:** `sudo apt update && sudo apt upgrade` secara rutin
- **Pantau Tailscale:** Tinjau perangkat di [konsol admin Tailscale](https://login.tailscale.com/admin)

### Verifikasi posture keamanan

```bash
# Konfirmasi tidak ada port publik yang melakukan listen
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifikasi Tailscale SSH aktif
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opsional: nonaktifkan sshd sepenuhnya
sudo systemctl disable --now ssh
```

---

## Fallback: SSH Tunnel

Jika Tailscale Serve tidak berfungsi, gunakan SSH tunnel:

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
- Coba lagi di jam non-puncak (pagi hari)
- Gunakan filter "Always Free" saat memilih shape

### Tailscale tidak mau terhubung

```bash
# Periksa status
sudo tailscale status

# Autentikasi ulang
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway tidak mau mulai

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Tidak bisa menjangkau Control UI

```bash
# Verifikasi Tailscale Serve berjalan
tailscale serve status

# Periksa apakah gateway melakukan listen
curl http://localhost:18789

# Restart jika perlu
systemctl --user restart openclaw-gateway.service
```

### Masalah binary ARM

Beberapa tool mungkin tidak memiliki build ARM. Periksa:

```bash
uname -m  # Harus menampilkan aarch64
```

Sebagian besar paket npm berfungsi dengan baik. Untuk binary, cari rilis `linux-arm64` atau `aarch64`.

---

## Persistensi

Semua state berada di:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/provider, dan data sesi
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory, artefak)

Lakukan backup secara berkala:

```bash
openclaw backup create
```

---

## Terkait

- [Akses remote Gateway](/id/gateway/remote) — pola akses remote lainnya
- [Integrasi Tailscale](/id/gateway/tailscale) — dokumentasi Tailscale lengkap
- [Konfigurasi gateway](/id/gateway/configuration) — semua opsi config
- [Panduan DigitalOcean](/id/install/digitalocean) — jika Anda menginginkan opsi berbayar + pendaftaran yang lebih mudah
- [Panduan Hetzner](/id/install/hetzner) — alternatif berbasis Docker
