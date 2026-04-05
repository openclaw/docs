---
read_when:
    - Menyiapkan OpenClaw di Raspberry Pi
    - Menjalankan OpenClaw di perangkat ARM
    - Membangun AI pribadi murah yang selalu aktif
summary: OpenClaw di Raspberry Pi (penyiapan self-hosted hemat biaya)
title: Raspberry Pi (Platform)
x-i18n:
    generated_at: "2026-04-05T14:01:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw di Raspberry Pi

## Tujuan

Jalankan OpenClaw Gateway persisten yang selalu aktif di Raspberry Pi dengan biaya sekali beli sekitar **~$35-80** (tanpa biaya bulanan).

Cocok untuk:

- Asisten AI pribadi 24/7
- Hub otomasi rumah
- Bot Telegram/WhatsApp berdaya rendah yang selalu tersedia

## Kebutuhan perangkat keras

| Model Pi        | RAM     | Berfungsi? | Catatan                           |
| --------------- | ------- | ---------- | --------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Terbaik | Paling cepat, direkomendasikan    |
| **Pi 4**        | 4GB     | ✅ Baik    | Titik ideal bagi sebagian besar pengguna |
| **Pi 4**        | 2GB     | ✅ Oke     | Berfungsi, tambahkan swap         |
| **Pi 4**        | 1GB     | ⚠️ Ketat   | Mungkin dengan swap, konfigurasi minimal |
| **Pi 3B+**      | 1GB     | ⚠️ Lambat  | Berfungsi tetapi lambat           |
| **Pi Zero 2 W** | 512MB   | ❌         | Tidak direkomendasikan            |

**Spesifikasi minimum:** 1GB RAM, 1 core, disk 500MB  
**Direkomendasikan:** RAM 2GB+, OS 64-bit, kartu SD 16GB+ (atau SSD USB)

## Yang Anda butuhkan

- Raspberry Pi 4 atau 5 (2GB+ direkomendasikan)
- Kartu MicroSD (16GB+) atau SSD USB (kinerja lebih baik)
- Catu daya (PSU Pi resmi direkomendasikan)
- Koneksi jaringan (Ethernet atau WiFi)
- ~30 menit

## 1) Flash OS

Gunakan **Raspberry Pi OS Lite (64-bit)** — desktop tidak diperlukan untuk server headless.

1. Unduh [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Pilih OS: **Raspberry Pi OS Lite (64-bit)**
3. Klik ikon roda gigi (⚙️) untuk prakonfigurasi:
   - Setel hostname: `gateway-host`
   - Aktifkan SSH
   - Setel nama pengguna/kata sandi
   - Konfigurasikan WiFi (jika tidak menggunakan Ethernet)
4. Flash ke kartu SD / drive USB Anda
5. Masukkan dan boot Pi

## 2) Hubungkan melalui SSH

```bash
ssh user@gateway-host
# atau gunakan alamat IP
ssh user@192.168.x.x
```

## 3) Penyiapan sistem

```bash
# Perbarui sistem
sudo apt update && sudo apt upgrade -y

# Pasang paket penting
sudo apt install -y git curl build-essential

# Setel zona waktu (penting untuk cron/pengingat)
sudo timedatectl set-timezone America/Chicago  # Ubah ke zona waktu Anda
```

## 4) Pasang Node.js 24 (ARM64)

```bash
# Pasang Node.js melalui NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi
node --version  # Harus menampilkan v24.x.x
npm --version
```

## 5) Tambahkan swap (penting untuk 2GB atau kurang)

Swap mencegah crash karena kehabisan memori:

```bash
# Buat file swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Jadikan permanen
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimalkan untuk RAM rendah (kurangi swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Pasang OpenClaw

### Opsi A: Instalasi standar (direkomendasikan)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opsi B: Instalasi yang bisa diutak-atik (untuk eksperimen)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Instalasi yang bisa diutak-atik memberi Anda akses langsung ke log dan kode — berguna untuk men-debug masalah khusus ARM.

## 7) Jalankan onboarding

```bash
openclaw onboard --install-daemon
```

Ikuti wizard:

1. **Mode Gateway:** Local
2. **Auth:** kunci API direkomendasikan (OAuth bisa sedikit merepotkan di Pi headless)
3. **Channels:** Telegram paling mudah untuk memulai
4. **Daemon:** Ya (systemd)

## 8) Verifikasi instalasi

```bash
# Periksa status
openclaw status

# Periksa layanan (instalasi standar = unit pengguna systemd)
systemctl --user status openclaw-gateway.service

# Lihat log
journalctl --user -u openclaw-gateway.service -f
```

## 9) Akses Dashboard OpenClaw

Ganti `user@gateway-host` dengan nama pengguna Pi Anda dan hostname atau alamat IP.

Di komputer Anda, minta Pi mencetak URL dashboard baru:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Perintah ini mencetak `Dashboard URL:`. Bergantung pada cara `gateway.auth.token`
dikonfigurasi, URL dapat berupa tautan `http://127.0.0.1:18789/` biasa atau
tautan yang menyertakan `#token=...`.

Di terminal lain pada komputer Anda, buat SSH tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Lalu buka Dashboard URL yang dicetak di browser lokal Anda.

Jika UI meminta auth shared-secret, tempel token atau password yang dikonfigurasi
ke pengaturan Control UI. Untuk auth token, gunakan `gateway.auth.token` (atau
`OPENCLAW_GATEWAY_TOKEN`).

Untuk akses remote yang selalu aktif, lihat [Tailscale](/id/gateway/tailscale).

---

## Optimasi kinerja

### Gunakan SSD USB (peningkatan besar)

Kartu SD lambat dan cepat aus. SSD USB sangat meningkatkan kinerja:

```bash
# Periksa apakah boot dari USB
lsblk
```

Lihat [panduan boot USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) untuk penyiapan.

### Percepat startup CLI (cache kompilasi modul)

Pada host Pi berdaya rendah, aktifkan cache kompilasi modul Node agar eksekusi CLI berulang lebih cepat:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Catatan:

- `NODE_COMPILE_CACHE` mempercepat eksekusi berikutnya (`status`, `health`, `--help`).
- `/var/tmp` bertahan setelah reboot lebih baik daripada `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` menghindari biaya startup tambahan dari self-respawn CLI.
- Eksekusi pertama menghangatkan cache; eksekusi berikutnya paling diuntungkan.

### Penyetelan startup systemd (opsional)

Jika Pi ini terutama menjalankan OpenClaw, tambahkan drop-in layanan untuk mengurangi jitter restart
dan menjaga env startup tetap stabil:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Lalu terapkan:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Jika memungkinkan, simpan state/cache OpenClaw di penyimpanan berbasis SSD untuk menghindari bottleneck
I/O acak kartu SD saat cold start.

Jika ini Pi headless, aktifkan lingering sekali agar layanan pengguna tetap berjalan
setelah logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Kurangi penggunaan memori

```bash
# Nonaktifkan alokasi memori GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Nonaktifkan Bluetooth jika tidak diperlukan
sudo systemctl disable bluetooth
```

### Pantau resource

```bash
# Periksa memori
free -h

# Periksa suhu CPU
vcgencmd measure_temp

# Pemantauan langsung
htop
```

---

## Catatan khusus ARM

### Kompatibilitas biner

Sebagian besar fitur OpenClaw berfungsi di ARM64, tetapi beberapa biner eksternal mungkin memerlukan build ARM:

| Tool               | Status ARM64 | Catatan                            |
| ------------------ | ------------ | ---------------------------------- |
| Node.js            | ✅           | Berfungsi sangat baik              |
| WhatsApp (Baileys) | ✅           | JS murni, tanpa masalah            |
| Telegram           | ✅           | JS murni, tanpa masalah            |
| gog (Gmail CLI)    | ⚠️           | Periksa apakah ada rilis ARM       |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Jika sebuah skill gagal, periksa apakah binernya memiliki build ARM. Banyak tool Go/Rust punya; sebagian tidak.

### 32-bit vs 64-bit

**Selalu gunakan OS 64-bit.** Node.js dan banyak tool modern memerlukannya. Periksa dengan:

```bash
uname -m
# Harus menampilkan: aarch64 (64-bit) bukan armv7l (32-bit)
```

---

## Penyiapan model yang direkomendasikan

Karena Pi hanya berfungsi sebagai Gateway (model berjalan di cloud), gunakan model berbasis API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**Jangan mencoba menjalankan LLM lokal di Pi** — bahkan model kecil terlalu lambat. Biarkan Claude/GPT menangani pekerjaan berat.

---

## Mulai otomatis saat boot

Onboarding menyiapkan ini, tetapi untuk verifikasi:

```bash
# Periksa apakah layanan diaktifkan
systemctl --user is-enabled openclaw-gateway.service

# Aktifkan jika belum
systemctl --user enable openclaw-gateway.service

# Mulai saat boot
systemctl --user start openclaw-gateway.service
```

---

## Pemecahan masalah

### Kehabisan memori (OOM)

```bash
# Periksa memori
free -h

# Tambahkan lebih banyak swap (lihat Langkah 5)
# Atau kurangi layanan yang berjalan di Pi
```

### Kinerja lambat

- Gunakan SSD USB alih-alih kartu SD
- Nonaktifkan layanan yang tidak digunakan: `sudo systemctl disable cups bluetooth avahi-daemon`
- Periksa throttling CPU: `vcgencmd get_throttled` (harus mengembalikan `0x0`)

### Layanan tidak mau mulai

```bash
# Periksa log
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Perbaikan umum: build ulang
cd ~/openclaw  # jika menggunakan instalasi yang bisa diutak-atik
npm run build
systemctl --user restart openclaw-gateway.service
```

### Masalah biner ARM

Jika sebuah skill gagal dengan "exec format error":

1. Periksa apakah binernya memiliki build ARM64
2. Coba build dari source
3. Atau gunakan container Docker dengan dukungan ARM

### WiFi terputus-putus

Untuk Pi headless yang menggunakan WiFi:

```bash
# Nonaktifkan manajemen daya WiFi
sudo iwconfig wlan0 power off

# Jadikan permanen
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Perbandingan biaya

| Penyiapan        | Biaya sekali beli | Biaya bulanan | Catatan                    |
| ---------------- | ----------------- | ------------- | -------------------------- |
| **Pi 4 (2GB)**   | ~$45              | $0            | + listrik (~$5/tahun)      |
| **Pi 4 (4GB)**   | ~$55              | $0            | Direkomendasikan           |
| **Pi 5 (4GB)**   | ~$60              | $0            | Kinerja terbaik            |
| **Pi 5 (8GB)**   | ~$80              | $0            | Berlebihan tetapi tahan masa depan |
| DigitalOcean     | $0                | $6/bln        | $72/tahun                  |
| Hetzner          | $0                | €3.79/bln     | ~$50/tahun                 |

**Titik impas:** Pi akan balik modal dalam ~6-12 bulan dibandingkan VPS cloud.

---

## Lihat juga

- [Panduan Linux](/platforms/linux) — penyiapan Linux umum
- [Panduan DigitalOcean](/platforms/digitalocean) — alternatif cloud
- [Panduan Hetzner](/install/hetzner) — penyiapan Docker
- [Tailscale](/id/gateway/tailscale) — akses remote
- [Nodes](/nodes) — pasangkan laptop/ponsel Anda dengan gateway Pi
