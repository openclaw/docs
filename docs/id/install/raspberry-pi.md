---
read_when:
    - Menyiapkan OpenClaw di Raspberry Pi
    - Menjalankan OpenClaw di perangkat ARM
    - Membangun AI pribadi murah yang selalu aktif
summary: Jalankan OpenClaw di Raspberry Pi untuk hosting mandiri yang selalu aktif
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:38:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Jalankan OpenClaw Gateway yang persisten dan selalu aktif di Raspberry Pi. Karena Pi hanya berfungsi sebagai Gateway (model berjalan di cloud melalui API), bahkan Pi sederhana dapat menangani beban kerja dengan baik — biaya perangkat keras biasanya **$35–80 sekali bayar**, tanpa biaya bulanan.

## Kompatibilitas perangkat keras

| Model Pi    | RAM    | Berfungsi? | Catatan                                  |
| ----------- | ------ | ---------- | ---------------------------------------- |
| Pi 5        | 4/8 GB | Terbaik    | Tercepat, direkomendasikan.              |
| Pi 4        | 4 GB   | Bagus      | Pilihan ideal untuk sebagian besar pengguna. |
| Pi 4        | 2 GB   | Cukup      | Tambahkan swap.                          |
| Pi 4        | 1 GB   | Terbatas   | Bisa dengan swap, konfigurasi minimal.   |
| Pi 3B+      | 1 GB   | Lambat     | Berfungsi tetapi tersendat.              |
| Pi Zero 2 W | 512 MB | Tidak      | Tidak direkomendasikan.                  |

**Minimum:** RAM 1 GB, 1 core, disk kosong 500 MB, OS 64-bit.
**Direkomendasikan:** RAM 2 GB+, kartu SD 16 GB+ (atau USB SSD), Ethernet.

## Prasyarat

- Raspberry Pi 4 atau 5 dengan RAM 2 GB+ (4 GB direkomendasikan)
- Kartu MicroSD (16 GB+) atau USB SSD (performa lebih baik)
- Catu daya resmi Pi
- Koneksi jaringan (Ethernet atau WiFi)
- Raspberry Pi OS 64-bit (wajib -- jangan gunakan 32-bit)
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Flash OS">
    Gunakan **Raspberry Pi OS Lite (64-bit)** -- desktop tidak diperlukan untuk server tanpa antarmuka.

    1. Unduh [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Pilih OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Di dialog pengaturan, konfigurasikan terlebih dahulu:
       - Nama host: `gateway-host`
       - Aktifkan SSH
       - Tetapkan nama pengguna dan kata sandi
       - Konfigurasikan WiFi (jika tidak menggunakan Ethernet)
    4. Flash ke kartu SD atau drive USB Anda, masukkan, lalu boot Pi.

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

    # Set timezone (important for cron and reminders)
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

    # Reduce swappiness for low-RAM devices
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

    Ikuti wizard. Kunci API lebih direkomendasikan daripada OAuth untuk perangkat tanpa antarmuka. Telegram adalah channel termudah untuk memulai.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Akses Control UI">
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

**Gunakan USB SSD** -- Kartu SD lambat dan cepat aus. USB SSD meningkatkan performa secara drastis. Lihat [panduan boot USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Aktifkan cache kompilasi modul** -- Mempercepat pemanggilan CLI berulang di host Pi berdaya rendah:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` menjaga restart rutin Gateway tetap dalam proses yang sama, sehingga menghindari handoff proses tambahan dan menjaga pelacakan PID tetap sederhana pada host kecil.

**Kurangi penggunaan memori** -- Untuk penyiapan tanpa antarmuka, bebaskan memori GPU dan nonaktifkan layanan yang tidak digunakan:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Konfigurasi tambahan systemd untuk restart stabil** -- Jika Pi ini sebagian besar menjalankan OpenClaw, tambahkan konfigurasi tambahan layanan:

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

Lalu `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Pada Pi tanpa antarmuka, aktifkan juga lingering satu kali agar layanan pengguna tetap berjalan setelah logout: `sudo loginctl enable-linger "$(whoami)"`.

## Penyiapan model yang direkomendasikan

Karena Pi hanya menjalankan Gateway, gunakan model API yang di-host di cloud:

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

Jangan jalankan LLM lokal di Pi — bahkan model kecil terlalu lambat untuk berguna. Biarkan Claude atau GPT menangani pekerjaan model.

## Catatan biner ARM

Sebagian besar fitur OpenClaw berfungsi di ARM64 tanpa perubahan (Node.js, Telegram, WhatsApp/Baileys, Chromium). Biner yang kadang tidak memiliki build ARM biasanya adalah alat CLI Go/Rust opsional yang dikirim oleh Skills. Verifikasi halaman rilis biner yang hilang untuk artefak `linux-arm64` / `aarch64` sebelum kembali ke membangun dari sumber.

## Persistensi dan cadangan

State OpenClaw berada di bawah:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agen, state channel/penyedia, sesi.
- `~/.openclaw/workspace/` — workspace agen (SOUL.md, memori, artefak).

Ini bertahan setelah reboot. Ambil snapshot portabel dengan:

```bash
openclaw backup create
```

Jika Anda menyimpannya di SSD, performa dan umur pakai meningkat dibandingkan kartu SD.

## Pemecahan masalah

**Kehabisan memori** -- Verifikasi swap aktif dengan `free -h`. Nonaktifkan layanan yang tidak digunakan (`sudo systemctl disable cups bluetooth avahi-daemon`). Gunakan hanya model berbasis API.

**Performa lambat** -- Gunakan USB SSD alih-alih kartu SD. Periksa throttling CPU dengan `vcgencmd get_throttled` (seharusnya mengembalikan `0x0`).

**Layanan tidak dapat dimulai** -- Periksa log dengan `journalctl --user -u openclaw-gateway.service --no-pager -n 100` dan jalankan `openclaw doctor --non-interactive`. Jika ini Pi tanpa antarmuka, verifikasi juga bahwa lingering aktif: `sudo loginctl enable-linger "$(whoami)"`.

**Masalah biner ARM** -- Jika sebuah skill gagal dengan "exec format error", periksa apakah biner tersebut memiliki build ARM64. Verifikasi arsitektur dengan `uname -m` (seharusnya menampilkan `aarch64`).

**WiFi terputus** -- Nonaktifkan manajemen daya WiFi: `sudo iwconfig wlan0 power off`.

## Langkah berikutnya

- [Channel](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Memperbarui](/id/install/updating) -- jaga OpenClaw tetap mutakhir

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Server Linux](/id/vps)
- [Platform](/id/platforms)
