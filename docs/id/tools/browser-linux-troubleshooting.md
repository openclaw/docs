---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Perbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan masalah browser
x-i18n:
    generated_at: "2026-07-12T14:42:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Masalah: Gagal memulai Chrome CDP pada port 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### Penyebab utama

Di Ubuntu dan sebagian besar distro Linux, `apt install chromium` memasang pembungkus snap,
bukan peramban sebenarnya:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Pembatasan AppArmor milik Snap mengganggu cara OpenClaw menjalankan dan memantau
proses peramban.

Kegagalan peluncuran Linux umum lainnya:

- `The profile appears to be in use by another Chromium process`: berkas kunci
  `Singleton*` usang dalam direktori profil terkelola. OpenClaw menghapus
  kunci ini dan mencoba sekali lagi saat kunci mengarah ke proses yang sudah
  mati atau proses pada host lain.
- `Missing X server or $DISPLAY`: peramban dengan tampilan diminta secara eksplisit
  pada host tanpa sesi desktop. Profil lokal terkelola beralih ke mode
  tanpa antarmuka di Linux saat `DISPLAY` dan `WAYLAND_DISPLAY` keduanya tidak disetel.
  Jika Anda menyetel `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false`, atau
  `browser.profiles.<name>.headless: false`, hapus penggantian mode bertampilan tersebut, setel
  `OPENCLAW_BROWSER_HEADLESS=1`, mulai `Xvfb`, jalankan
  `openclaw browser start --headless` untuk peluncuran terkelola sekali pakai, atau jalankan
  OpenClaw dalam sesi desktop sebenarnya.

### Solusi 1: instal Google Chrome (disarankan)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jika terdapat kesalahan dependensi
```

Perbarui `~/.openclaw/openclaw.json`:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Solusi 2: gunakan Chromium snap dalam mode hanya-lampirkan

Jika Anda harus tetap menggunakan Chromium snap, konfigurasikan OpenClaw agar terhubung ke
peramban yang dimulai secara manual alih-alih meluncurkannya:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

Mulai Chromium secara manual:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Secara opsional, mulai otomatis dengan layanan pengguna systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Verifikasi bahwa peramban berfungsi

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referensi konfigurasi

| Opsi                             | Deskripsi                                                                    | Bawaan                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `browser.enabled`                | Aktifkan kontrol peramban                                                    | `true`                                                                       |
| `browser.executablePath`         | Jalur ke biner peramban berbasis Chromium (Chrome/Brave/Edge/Chromium)       | terdeteksi otomatis (mengutamakan peramban bawaan OS jika berbasis Chromium) |
| `browser.headless`               | Jalankan tanpa GUI                                                           | `false`                                                                      |
| `OPENCLAW_BROWSER_HEADLESS`      | Penggantian per proses untuk mode tanpa antarmuka peramban lokal terkelola   | tidak disetel                                                                |
| `browser.noSandbox`              | Tambahkan flag `--no-sandbox` (diperlukan untuk beberapa konfigurasi Linux)  | `false`                                                                      |
| `browser.attachOnly`             | Jangan luncurkan peramban; hanya hubungkan ke peramban yang sudah ada        | `false`                                                                      |
| `browser.cdpPortRangeStart`      | Port CDP lokal awal untuk profil yang ditetapkan otomatis                    | `18800` (diturunkan dari port Gateway)                                       |
| `browser.localLaunchTimeoutMs`   | Batas waktu penemuan Chrome lokal terkelola, hingga `120000`                 | `15000`                                                                      |
| `browser.localCdpReadyTimeoutMs` | Batas waktu kesiapan CDP setelah peluncuran lokal terkelola, hingga `120000` | `8000`                                                                       |

Kedua nilai batas waktu harus berupa bilangan bulat positif hingga `120000` md; nilai lainnya
ditolak saat konfigurasi dimuat. Pada Raspberry Pi, host VPS lama, atau penyimpanan
lambat, naikkan `browser.localLaunchTimeoutMs` jika Chrome memerlukan waktu lebih lama untuk
menyediakan titik akhir HTTP CDP-nya. Naikkan `browser.localCdpReadyTimeoutMs` jika
peluncuran berhasil tetapi `openclaw browser start` masih melaporkan `not reachable
after start`.

### Masalah: Tidak ditemukan tab Chrome untuk profile="user"

Anda menggunakan profil `user` (`existing-session` / Chrome MCP) dan tidak ada
tab yang terbuka untuk dihubungkan.

Opsi perbaikan:

1. Gunakan peramban terkelola sebagai gantinya:
   `openclaw browser --browser-profile openclaw start` (atau setel
   `browser.defaultProfile: "openclaw"`).
2. Biarkan Chrome lokal tetap berjalan dengan setidaknya satu tab terbuka, lalu coba lagi dengan
   `--browser-profile user`.

Catatan:

- `user` hanya tersedia pada host. Pada server Linux, kontainer, atau host jarak jauh, utamakan
  profil CDP.
- `user` dan profil `existing-session` lainnya memiliki batasan Chrome MCP saat ini
  yang sama: hanya tindakan berbasis referensi, satu berkas per unggahan, tanpa penggantian
  `timeoutMs` dialog, tanpa `wait --load networkidle`, serta tanpa `responsebody`, ekspor PDF,
  intersepsi unduhan, atau tindakan massal.
- Profil driver `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; hanya setel
  nilai tersebut secara manual untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk penemuan `/json/version`, atau WS(S) jika layanan peramban
  memberikan URL soket DevTools langsung.

## Terkait

- [Peramban](/id/tools/browser)
- [Masuk ke peramban](/id/tools/browser-login)
- [Pemecahan masalah WSL2 peramban](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
