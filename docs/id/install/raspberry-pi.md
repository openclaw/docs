---
read_when:
    - Menyiapkan OpenClaw di Raspberry Pi
    - Menjalankan OpenClaw pada perangkat ARM
    - Membangun AI pribadi murah yang selalu aktif
summary: Hosting OpenClaw di Raspberry Pi untuk hosting mandiri yang selalu aktif
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T14:20:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Jalankan Gateway OpenClaw yang persisten dan selalu aktif pada Raspberry Pi. Karena Pi hanya berfungsi sebagai gateway (model berjalan di cloud melalui API), bahkan Pi dengan spesifikasi sederhana dapat menangani beban kerja dengan baik -- biaya perangkat keras umumnya **$35-80 sekali bayar**, tanpa biaya bulanan.

## Kompatibilitas perangkat keras

| Model Pi    | RAM    | Berfungsi? | Catatan                                      |
| ----------- | ------ | ---------- | -------------------------------------------- |
| Pi 5        | 4/8 GB | Terbaik    | Paling cepat, direkomendasikan.              |
| Pi 4        | 4 GB   | Baik       | Pilihan ideal bagi sebagian besar pengguna.  |
| Pi 4        | 2 GB   | Cukup      | Tambahkan swap.                              |
| Pi 4        | 1 GB   | Terbatas   | Dapat digunakan dengan swap dan konfigurasi minimal. |
| Pi 3B+      | 1 GB   | Lambat     | Berfungsi, tetapi kurang responsif.           |
| Pi Zero 2 W | 512 MB | Tidak      | Tidak direkomendasikan.                      |

**Minimum:** RAM 1 GB, 1 inti, ruang disk kosong 500 MB, OS 64-bit.
**Direkomendasikan:** RAM 2 GB+, kartu SD 16 GB+ (atau SSD USB), Ethernet.

## Prasyarat

- Raspberry Pi 4 atau 5 dengan RAM 2 GB+ (direkomendasikan 4 GB)
- Kartu MicroSD (16 GB+) atau SSD USB (kinerja lebih baik)
- Catu daya resmi Pi
- Koneksi jaringan (Ethernet atau WiFi)
- Raspberry Pi OS 64-bit (wajib -- jangan gunakan versi 32-bit)
- Sekitar 30 menit

## Penyiapan

<Steps>
  <Step title="Flas OS">
    Gunakan **Raspberry Pi OS Lite (64-bit)** -- desktop tidak diperlukan untuk server tanpa monitor.

    1. Unduh [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Pilih OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Dalam dialog pengaturan, lakukan prakonfigurasi:
       - Nama host: `gateway-host`
       - Aktifkan SSH
       - Tetapkan nama pengguna dan kata sandi
       - Konfigurasikan WiFi (jika tidak menggunakan Ethernet)
    4. Flas ke kartu SD atau drive USB, masukkan perangkat tersebut, lalu nyalakan Pi.

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

    # Atur zona waktu (penting untuk cron dan pengingat)
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

  <Step title="Tambahkan swap (penting untuk RAM 2 GB atau kurang)">
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

  <Step title="Jalankan orientasi awal">
    ```bash
    openclaw onboard --install-daemon
    ```

    Ikuti wisaya. Kunci API lebih direkomendasikan daripada OAuth untuk perangkat tanpa monitor. Telegram adalah saluran termudah untuk memulai.

  </Step>

  <Step title="Verifikasi">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Akses Antarmuka Kontrol">
    Di komputer Anda, dapatkan URL dasbor dari Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Kemudian buat terowongan SSH di terminal lain:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Buka URL yang dicetak di peramban lokal Anda. Untuk akses jarak jauh yang selalu aktif, lihat [integrasi Tailscale](/id/gateway/tailscale).

  </Step>
</Steps>

## Kiat kinerja

**Gunakan SSD USB** -- kartu SD lambat dan cepat aus. SSD USB meningkatkan kinerja secara drastis dan mampu bertahan lebih banyak siklus penulisan; gunakan SSD tersebut untuk `OPENCLAW_STATE_DIR` jika Anda tetap menyimpan OS di SD. Lihat [panduan boot USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Aktifkan cache kompilasi modul** -- Mempercepat pemanggilan CLI berulang pada host Pi berdaya rendah. `OPENCLAW_NO_RESPAWN=1` membuat mulai ulang rutin Gateway tetap berlangsung dalam proses yang sama, sehingga menghindari serah-terima proses tambahan dan menjaga pelacakan PID tetap sederhana pada host kecil:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Gunakan `/var/tmp`, bukan `/tmp` -- beberapa distribusi menghapus isi `/tmp` saat boot, yang menghilangkan cache yang telah dipanaskan.

**Kurangi penggunaan memori** -- Untuk penyiapan tanpa monitor, bebaskan memori GPU dan nonaktifkan layanan yang tidak digunakan:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Konfigurasi tambahan systemd untuk mulai ulang yang stabil** -- Jika Pi ini sebagian besar digunakan untuk menjalankan OpenClaw, tambahkan konfigurasi tambahan layanan:

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

Kemudian jalankan `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Pada Pi tanpa monitor, aktifkan juga lingering satu kali agar layanan pengguna tetap berjalan setelah keluar: `sudo loginctl enable-linger "$(whoami)"`.

## Penyiapan model yang direkomendasikan

Karena Pi hanya menjalankan gateway, gunakan model API yang dihosting di cloud -- jangan jalankan LLM lokal pada Pi karena model kecil sekalipun terlalu lambat untuk digunakan:

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

## Catatan biner ARM

Sebagian besar fitur OpenClaw berfungsi di ARM64 tanpa perubahan (Node.js, Telegram, WhatsApp/Baileys, Chromium). Biner yang terkadang tidak memiliki versi ARM biasanya berupa alat CLI Go/Rust opsional yang disertakan oleh Skills. Verifikasi arsitektur dengan `uname -m` (seharusnya menampilkan `aarch64`), lalu periksa halaman rilis biner yang tidak tersedia untuk artefak `linux-arm64` / `aarch64` sebelum beralih ke kompilasi dari sumber.

## Persistensi dan pencadangan

Status OpenClaw berada di:

- `~/.openclaw/` -- `openclaw.json`, `auth-profiles.json` per agen, status saluran/penyedia, sesi.
- `~/.openclaw/workspace/` -- ruang kerja agen (SOUL.md, memori, artefak).

Data tersebut tetap tersimpan setelah mulai ulang dan akan memperoleh manfaat dari penggunaan SSD dibandingkan kartu SD, baik dari sisi kinerja maupun umur pakai. Buat snapshot portabel dengan:

```bash
openclaw backup create
```

## Pemecahan masalah

**Kehabisan memori** -- Verifikasi bahwa swap aktif dengan `free -h`. Nonaktifkan layanan yang tidak digunakan (`sudo systemctl disable cups bluetooth avahi-daemon`). Gunakan hanya model berbasis API.

**Kinerja lambat** -- Gunakan SSD USB sebagai pengganti kartu SD. Periksa pembatasan CPU dengan `vcgencmd get_throttled` (seharusnya menghasilkan `0x0`).

**Layanan tidak dapat dimulai** -- Periksa log dengan `journalctl --user -u openclaw-gateway.service --no-pager -n 100` dan jalankan `openclaw doctor --non-interactive`. Jika ini adalah Pi tanpa monitor, verifikasi juga bahwa lingering telah diaktifkan: `sudo loginctl enable-linger "$(whoami)"`.

**Masalah biner ARM** -- Jika suatu skill gagal dengan "exec format error", periksa apakah biner tersebut memiliki versi ARM64. Verifikasi arsitektur dengan `uname -m` (seharusnya menampilkan `aarch64`).

**Koneksi WiFi terputus** -- Nonaktifkan pengelolaan daya WiFi: `sudo iwconfig wlan0 power off`.

## Langkah berikutnya

- [Saluran](/id/channels) -- hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration) -- semua opsi konfigurasi
- [Pembaruan](/id/install/updating) -- jaga agar OpenClaw tetap mutakhir

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Server Linux](/id/vps)
- [Platform](/id/platforms)
