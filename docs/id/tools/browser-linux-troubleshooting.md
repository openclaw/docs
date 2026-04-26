---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Perbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan masalah browser
x-i18n:
    generated_at: "2026-04-26T11:39:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e5b42532af002af3d6a3ab21df7f82d2d62ce9f23b57a94cdb97e8ac65df3b
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Masalah: "Failed to start Chrome CDP on port 18800"

Server kontrol browser OpenClaw gagal meluncurkan Chrome/Brave/Edge/Chromium dengan error:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Akar Masalah

Di Ubuntu (dan banyak distro Linux), instalasi Chromium default adalah **paket snap**. Confinement AppArmor milik snap mengganggu cara OpenClaw memunculkan dan memantau proses browser.

Perintah `apt install chromium` menginstal paket stub yang mengarahkan ke snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ini BUKAN browser sungguhan - hanya wrapper.

Kegagalan peluncuran Linux umum lainnya:

- `The profile appears to be in use by another Chromium process` berarti Chrome
  menemukan file lock `Singleton*` basi di direktori profil terkelola. OpenClaw
  menghapus lock tersebut dan mencoba ulang sekali ketika lock menunjuk ke proses yang mati atau host yang berbeda.
- `Missing X server or $DISPLAY` berarti browser terlihat secara eksplisit diminta
  pada host tanpa sesi desktop. Secara default, profil terkelola lokal sekarang fallback ke mode headless di Linux ketika `DISPLAY` dan
  `WAYLAND_DISPLAY` sama-sama tidak disetel. Jika Anda menyetel `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, atau `browser.profiles.<name>.headless: false`,
  hapus override headed tersebut, setel `OPENCLAW_BROWSER_HEADLESS=1`, mulai `Xvfb`,
  jalankan `openclaw browser start --headless` untuk peluncuran terkelola sekali pakai, atau jalankan
  OpenClaw dalam sesi desktop nyata.

### Solusi 1: Instal Google Chrome (Disarankan)

Instal paket `.deb` Google Chrome resmi, yang tidak disandbox oleh snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jika ada error dependensi
```

Lalu perbarui config OpenClaw Anda (`~/.openclaw/openclaw.json`):

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

### Solusi 2: Gunakan Snap Chromium dengan Mode Attach-Only

Jika Anda harus menggunakan snap Chromium, konfigurasikan OpenClaw agar attach ke browser yang dimulai secara manual:

1. Perbarui config:

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

2. Mulai Chromium secara manual:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Secara opsional buat service systemd pengguna untuk memulai Chrome secara otomatis:

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

Aktifkan dengan: `systemctl --user enable --now openclaw-browser.service`

### Memverifikasi Browser Berfungsi

Periksa status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Uji penelusuran:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referensi Konfigurasi

| Option                           | Deskripsi                                                            | Default                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Aktifkan kontrol browser                                             | `true`                                                      |
| `browser.executablePath`         | Path ke binary browser berbasis Chromium (Chrome/Brave/Edge/Chromium) | terdeteksi otomatis (memilih browser default bila berbasis Chromium) |
| `browser.headless`               | Jalankan tanpa GUI                                                   | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Override per-proses untuk mode headless browser terkelola lokal      | tidak disetel                                               |
| `browser.noSandbox`              | Tambahkan flag `--no-sandbox` (dibutuhkan untuk beberapa penyiapan Linux) | `false`                                                  |
| `browser.attachOnly`             | Jangan luncurkan browser, hanya attach ke yang sudah ada             | `false`                                                     |
| `browser.cdpPort`                | Port Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Timeout penemuan Chrome terkelola lokal                              | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Timeout kesiapan CDP pasca-peluncuran terkelola lokal                | `8000`                                                      |

Pada Raspberry Pi, host VPS lama, atau penyimpanan lambat, naikkan
`browser.localLaunchTimeoutMs` ketika Chrome memerlukan lebih banyak waktu untuk mengekspos endpoint HTTP CDP-nya.
Naikkan `browser.localCdpReadyTimeoutMs` ketika peluncuran berhasil tetapi
`openclaw browser start` masih melaporkan `not reachable after start`. Nilai harus
berupa integer positif hingga `120000` ms; nilai config yang tidak valid akan ditolak.

### Masalah: "No Chrome tabs found for profile=\"user\""

Anda sedang menggunakan profil `existing-session` / Chrome MCP. OpenClaw dapat melihat Chrome lokal,
tetapi tidak ada tab terbuka yang tersedia untuk di-attach.

Opsi perbaikan:

1. **Gunakan browser terkelola:** `openclaw browser start --browser-profile openclaw`
   (atau setel `browser.defaultProfile: "openclaw"`).
2. **Gunakan Chrome MCP:** pastikan Chrome lokal berjalan dengan setidaknya satu tab terbuka, lalu coba lagi dengan `--browser-profile user`.

Catatan:

- `user` hanya untuk host. Untuk server Linux, kontainer, atau host jarak jauh, pilih profil CDP.
- `user` / profil `existing-session` lainnya mempertahankan batas Chrome MCP saat ini:
  aksi berbasis ref, hook unggah satu file, tanpa override timeout dialog, tanpa
  `wait --load networkidle`, dan tanpa `responsebody`, ekspor PDF, intersepsi unduhan, atau aksi batch.
- Profil `openclaw` lokal mengalokasikan otomatis `cdpPort`/`cdpUrl`; setel itu hanya untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk penemuan `/json/version`, atau WS(S) ketika service browser Anda
  memberi URL socket DevTools langsung.

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
