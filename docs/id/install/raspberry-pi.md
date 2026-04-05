---
read_when:
    - Menyiapkan OpenClaw di Raspberry Pi
    - Menjalankan OpenClaw di perangkat ARM
    - Membangun AI pribadi murah yang selalu aktif
summary: Host OpenClaw di Raspberry Pi untuk self-hosting yang selalu aktif
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T13:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Jalankan OpenClaw Gateway yang persisten dan selalu aktif di Raspberry Pi. Karena Pi hanya berfungsi sebagai gateway (model berjalan di cloud melalui API), bahkan Pi dengan spesifikasi sederhana pun dapat menangani beban kerja ini dengan baik.

## Prasyarat

- Raspberry Pi 4 atau 5 dengan RAM 2 GB+ (4 GB direkomendasikan)
- Kartu MicroSD (16 GB+) atau SSD USB (performa lebih baik)
- Catu daya resmi Pi
- Koneksi jaringan (Ethernet atau WiFi)
- Raspberry Pi OS 64-bit (wajib -- jangan gunakan 32-bit)
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Flash OS">
    Gunakan **Raspberry Pi OS Lite (64-bit)** -- tidak memerlukan desktop untuk server tanpa antarmuka.

    1. Unduh [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Pilih OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Di dialog pengaturan, lakukan pra-konfigurasi:
       - Hostname: `gateway-host`
       - Aktifkan SSH
       - Tetapkan nama pengguna dan kata sandi
       - Konfigurasikan WiFi (jika tidak menggunakan Ethernet)
    4. Flash ke kartu SD atau drive USB Anda, masukkan, lalu nyalakan Pi.

  </Step>

  <Step title="Hubungkan melalui SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Perbarui sistem">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Tetapkan zona waktu (penting untuk cron dan pengingat)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Instal Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Tambahkan swap (penting untuk 2 GB atau kurang)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Kurangi swappiness untuk perangkat dengan RAM rendah
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Instal OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Jalankan onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Ikuti wizard. API key lebih direkomendasikan daripada OAuth untuk perangkat tanpa antarmuka. Telegram adalah channel termudah untuk memulai.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Akses UI Kontrol">
    Di komputer Anda, dapatkan URL dasbor dari Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Lalu buat tunnel SSH di terminal lain:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Buka URL yang dicetak di browser lokal Anda. Untuk akses jarak jauh yang selalu aktif, lihat [integrasi Tailscale](/id/gateway/tailscale).

  </Step>
</Steps>

## Tips performa

**Gunakan SSD USB** -- kartu SD lambat dan cepat aus. SSD USB secara drastis meningkatkan performa. Lihat [panduan boot USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Aktifkan module compile cache** -- Mempercepat pemanggilan CLI berulang pada host Pi berdaya rendah:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Kurangi penggunaan memori** -- Untuk setup tanpa antarmuka, kosongkan memori GPU dan nonaktifkan layanan yang tidak digunakan:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Pemecahan masalah

**Kehabisan memori** -- Verifikasi bahwa swap aktif dengan `free -h`. Nonaktifkan layanan yang tidak digunakan (`sudo systemctl disable cups bluetooth avahi-daemon`). Gunakan hanya model berbasis API.

**Performa lambat** -- Gunakan SSD USB alih-alih kartu SD. Periksa throttling CPU dengan `vcgencmd get_throttled` (seharusnya mengembalikan `0x0`).

**Layanan tidak mau mulai** -- Periksa log dengan `journalctl --user -u openclaw-gateway.service --no-pager -n 100` dan jalankan `openclaw doctor --non-interactive`. Jika ini adalah Pi tanpa antarmuka, verifikasi juga bahwa lingering diaktifkan: `sudo loginctl enable-linger "$(whoami)"`.

**Masalah biner ARM** -- Jika sebuah skill gagal dengan "exec format error", periksa apakah biner tersebut memiliki build ARM64. Verifikasi arsitektur dengan `uname -m` (seharusnya menampilkan `aarch64`).

**WiFi terputus-putus** -- Nonaktifkan manajemen daya WiFi: `sudo iwconfig wlan0 power off`.

## Langkah selanjutnya

- [Channels](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Memperbarui](/install/updating) -- jaga agar OpenClaw tetap terbaru
