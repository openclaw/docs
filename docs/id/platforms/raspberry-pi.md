---
read_when:
    - Menyiapkan OpenClaw di Raspberry Pi
    - Menjalankan OpenClaw di perangkat ARM
    - Membangun AI pribadi murah yang selalu aktif
summary: OpenClaw di Raspberry Pi (penyiapan hosting mandiri hemat biaya)
title: Raspberry Pi (platform)
x-i18n:
    generated_at: "2026-04-30T09:59:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw di Raspberry Pi

## Tujuan

Jalankan OpenClaw Gateway yang persisten dan selalu aktif di Raspberry Pi dengan biaya satu kali **~$35-80** (tanpa biaya bulanan).

Sempurna untuk:

- Asisten AI pribadi 24/7
- Hub otomatisasi rumah
- Bot Telegram/WhatsApp berdaya rendah yang selalu tersedia

## Persyaratan perangkat keras

| Model Pi         | RAM     | Berfungsi?   | Catatan                              |
| ---------------- | ------- | ------------ | ------------------------------------ |
| **Pi 5**         | 4GB/8GB | ✅ Terbaik   | Tercepat, direkomendasikan           |
| **Pi 4**         | 4GB     | ✅ Baik      | Pilihan paling seimbang bagi sebagian besar pengguna |
| **Pi 4**         | 2GB     | ✅ OK        | Berfungsi, tambahkan swap            |
| **Pi 4**         | 1GB     | ⚠️ Terbatas | Mungkin dengan swap, konfigurasi minimal |
| **Pi 3B+**       | 1GB     | ⚠️ Lambat   | Berfungsi tetapi lamban              |
| **Pi Zero 2 W**  | 512MB   | ❌           | Tidak direkomendasikan               |

**Spesifikasi minimum:** RAM 1GB, 1 core, disk 500MB  
**Direkomendasikan:** RAM 2GB+, OS 64-bit, kartu SD 16GB+ (atau USB SSD)

## Yang Anda perlukan

- Raspberry Pi 4 atau 5 (2GB+ direkomendasikan)
- Kartu MicroSD (16GB+) atau USB SSD (performa lebih baik)
- Catu daya (PSU resmi Pi direkomendasikan)
- Koneksi jaringan (Ethernet atau WiFi)
- ~30 menit

## 1) Flash OS

Gunakan **Raspberry Pi OS Lite (64-bit)** — desktop tidak diperlukan untuk server headless.

1. Unduh [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Pilih OS: **Raspberry Pi OS Lite (64-bit)**
3. Klik ikon roda gigi (⚙️) untuk pra-konfigurasi:
   - Tetapkan hostname: `gateway-host`
   - Aktifkan SSH
   - Tetapkan nama pengguna/kata sandi
   - Konfigurasikan WiFi (jika tidak memakai Ethernet)
4. Flash ke kartu SD / drive USB Anda
5. Masukkan dan boot Pi

## 2) Hubungkan melalui SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Penyiapan Sistem

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Instal Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Tambahkan Swap (Penting untuk 2GB atau kurang)

Swap mencegah crash karena kehabisan memori:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Instal OpenClaw

### Opsi A: instalasi standar (direkomendasikan)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opsi B: instalasi yang dapat diutak-atik (untuk bereksperimen)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Instalasi yang dapat diutak-atik memberi Anda akses langsung ke log dan kode — berguna untuk men-debug masalah khusus ARM.

## 7) Jalankan Onboarding

```bash
openclaw onboard --install-daemon
```

Ikuti wizard:

1. **Mode Gateway:** Lokal
2. **Auth:** API key direkomendasikan (OAuth bisa rewel pada Pi headless)
3. **Channel:** Telegram paling mudah untuk memulai
4. **Daemon:** Ya (systemd)

## 8) Verifikasi Instalasi

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Akses OpenClaw Dashboard

Ganti `user@gateway-host` dengan nama pengguna Pi dan hostname atau alamat IP Anda.

Di komputer Anda, minta Pi mencetak URL dashboard baru:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Perintah ini mencetak `Dashboard URL:`. Bergantung pada bagaimana `gateway.auth.token`
dikonfigurasi, URL dapat berupa tautan `http://127.0.0.1:18789/` biasa atau tautan
yang menyertakan `#token=...`.

Di terminal lain pada komputer Anda, buat tunnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Lalu buka Dashboard URL yang dicetak di browser lokal Anda.

Jika UI meminta autentikasi shared-secret, tempelkan token atau kata sandi yang
dikonfigurasi ke pengaturan Control UI. Untuk auth token, gunakan `gateway.auth.token` (atau
`OPENCLAW_GATEWAY_TOKEN`).

Untuk akses jarak jauh yang selalu aktif, lihat [Tailscale](/id/gateway/tailscale).

---

## Optimasi performa

### Gunakan USB SSD (Peningkatan Besar)

Kartu SD lambat dan cepat aus. USB SSD meningkatkan performa secara drastis:

```bash
# Check if booting from USB
lsblk
```

Lihat [panduan boot USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) untuk penyiapan.

### Percepat startup CLI (cache kompilasi modul)

Pada host Pi berdaya lebih rendah, aktifkan cache kompilasi modul Node agar eksekusi CLI berulang lebih cepat:

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
- `/var/tmp` bertahan lebih baik setelah reboot daripada `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` menghindari biaya startup tambahan dari self-respawn CLI.
- Eksekusi pertama menghangatkan cache; eksekusi berikutnya paling merasakan manfaatnya.

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

Jika memungkinkan, simpan state/cache OpenClaw pada penyimpanan berbasis SSD untuk menghindari
bottleneck I/O acak kartu SD saat cold start.

Jika ini Pi headless, aktifkan lingering sekali agar layanan pengguna tetap berjalan
setelah logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Bagaimana kebijakan `Restart=` membantu pemulihan otomatis:
[systemd dapat mengotomatiskan pemulihan layanan](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Kurangi penggunaan memori

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Pantau sumber daya

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Catatan Khusus ARM

### Kompatibilitas biner

Sebagian besar fitur OpenClaw berfungsi di ARM64, tetapi beberapa biner eksternal mungkin memerlukan build ARM:

| Tool               | Status ARM64 | Catatan                             |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | Berfungsi sangat baik               |
| WhatsApp (Baileys) | ✅           | JS murni, tidak ada masalah         |
| Telegram           | ✅           | JS murni, tidak ada masalah         |
| gog (Gmail CLI)    | ⚠️           | Periksa rilis ARM                   |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser` |

Jika sebuah skill gagal, periksa apakah binernya memiliki build ARM. Banyak tool Go/Rust memilikinya; sebagian tidak.

### 32-bit vs 64-bit

**Selalu gunakan OS 64-bit.** Node.js dan banyak tool modern memerlukannya. Periksa dengan:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Penyiapan model yang direkomendasikan

Karena Pi hanya berperan sebagai Gateway (model berjalan di cloud), gunakan model berbasis API:

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

## Auto-Start saat Boot

Onboarding menyiapkan ini, tetapi untuk memverifikasi:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Pemecahan masalah

### Kehabisan Memori (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Performa lambat

- Gunakan USB SSD alih-alih kartu SD
- Nonaktifkan layanan yang tidak digunakan: `sudo systemctl disable cups bluetooth avahi-daemon`
- Periksa throttling CPU: `vcgencmd get_throttled` (seharusnya mengembalikan `0x0`)

### Layanan tidak mau mulai

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Masalah Biner ARM

Jika sebuah skill gagal dengan "exec format error":

1. Periksa apakah biner memiliki build ARM64
2. Coba build dari sumber
3. Atau gunakan kontainer Docker dengan dukungan ARM

### WiFi Terputus

Untuk Pi headless di WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Perbandingan biaya

| Penyiapan       | Biaya Satu Kali | Biaya Bulanan | Catatan                   |
| --------------- | --------------- | ------------- | ------------------------- |
| **Pi 4 (2GB)**  | ~$45            | $0            | + daya (~$5/tahun)        |
| **Pi 4 (4GB)**  | ~$55            | $0            | Direkomendasikan          |
| **Pi 5 (4GB)**  | ~$60            | $0            | Performa terbaik          |
| **Pi 5 (8GB)**  | ~$80            | $0            | Berlebihan tetapi tahan masa depan |
| DigitalOcean    | $0              | $6/bln        | $72/tahun                 |
| Hetzner         | $0              | €3.79/bln     | ~$50/tahun                |

**Titik impas:** Pi membayar dirinya sendiri dalam ~6-12 bulan dibandingkan VPS cloud.

---

## Terkait

- [Panduan Linux](/id/platforms/linux) — penyiapan Linux umum
- [Panduan DigitalOcean](/id/install/digitalocean) — alternatif cloud
- [Panduan Hetzner](/id/install/hetzner) — penyiapan Docker
- [Tailscale](/id/gateway/tailscale) — akses jarak jauh
- [Nodes](/id/nodes) — pasangkan laptop/ponsel Anda dengan Gateway Pi
