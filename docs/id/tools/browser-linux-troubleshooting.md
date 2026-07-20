---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Perbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan masalah browser
x-i18n:
    generated_at: "2026-07-20T04:01:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5db2da2d43129862f0c005213df828f6eae81f5561e57d41795ea90787822a
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Masalah: Gagal memulai Chrome CDP pada port 18800

```json
{ "error": "Kesalahan: Gagal memulai Chrome CDP pada port 18800 untuk profil \"openclaw\"." }
```

### Penyebab utama

Di Ubuntu dan sebagian besar distro Linux, `apt install chromium` memasang wrapper
snap, bukan peramban sebenarnya:

```text
Catatan, memilih 'chromium-browser' alih-alih 'chromium'
chromium-browser sudah merupakan versi terbaru (2:1snap1-0ubuntu2).
```

Pembatasan AppArmor dari Snap mengganggu cara OpenClaw menjalankan dan memantau
proses peramban.

Kegagalan peluncuran Linux umum lainnya:

- `The profile appears to be in use by another Chromium process`: file kunci
  `Singleton*` yang kedaluwarsa di direktori profil terkelola. OpenClaw menghapus
  kunci ini dan mencoba kembali satu kali saat kunci tersebut menunjuk ke proses yang sudah mati atau
  berada di host lain.
- `Missing X server or $DISPLAY`: peramban yang terlihat diminta secara eksplisit
  pada host tanpa sesi desktop. Profil lokal terkelola beralih ke
  mode headless di Linux saat `DISPLAY` dan `WAYLAND_DISPLAY` tidak disetel.
  Jika Anda menyetel `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false`, atau
  `browser.profiles.<name>.headless: false`, hapus penggantian mode headed tersebut, setel
  `OPENCLAW_BROWSER_HEADLESS=1`, mulai `Xvfb`, jalankan
  `openclaw browser start --headless` untuk peluncuran terkelola satu kali, atau jalankan
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

Secara opsional, mulai secara otomatis dengan layanan pengguna systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Peramban OpenClaw (Chrome CDP)
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

| Opsi                        | Deskripsi                                                            | Default                                                               |
| --------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `browser.enabled`           | Aktifkan kontrol peramban                                            | `true`                                                    |
| `browser.executablePath`    | Jalur ke biner peramban berbasis Chromium (Chrome/Brave/Edge/Chromium) | terdeteksi otomatis (mengutamakan peramban default OS jika berbasis Chromium) |
| `browser.headless`          | Jalankan tanpa GUI                                                   | `false`                                                    |
| `OPENCLAW_BROWSER_HEADLESS` | Penggantian per proses untuk mode headless peramban lokal terkelola   | tidak disetel                                                         |
| `browser.noSandbox`         | Tambahkan flag `--no-sandbox` (diperlukan untuk beberapa konfigurasi Linux) | `false`                                                    |
| `browser.attachOnly`        | Jangan meluncurkan peramban; hanya hubungkan ke peramban yang sudah ada | `false`                                                    |

Pada Raspberry Pi, host VPS lama, atau penyimpanan lambat, gunakan peramban yang diluncurkan
secara manual dengan `attachOnly` saat Chrome memerlukan lebih banyak waktu untuk menyediakan endpoint
HTTP CDP atau menjadi siap daripada tenggat peramban terkelola yang diizinkan.

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

- `user` hanya untuk host. Pada server Linux, kontainer, atau host jarak jauh, sebaiknya gunakan
  profil CDP.
- `user` dan profil `existing-session` lainnya memiliki batasan Chrome MCP
  saat ini yang sama: hanya tindakan berbasis ref, satu file per unggahan, tanpa penggantian `timeoutMs`
  dialog, tanpa `wait --load networkidle`, serta tanpa `responsebody`, ekspor PDF,
  intersepsi unduhan, atau tindakan batch.
- Profil driver `openclaw` lokal menetapkan `cdpPort`/`cdpUrl` secara otomatis; hanya setel
  keduanya secara manual untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk penemuan `/json/version`, atau WS(S) saat layanan
  peramban Anda memberikan URL soket DevTools langsung.

## Terkait

- [Peramban](/id/tools/browser)
- [Login peramban](/id/tools/browser-login)
- [Pemecahan masalah WSL2 peramban](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
