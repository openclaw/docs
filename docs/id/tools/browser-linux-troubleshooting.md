---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Perbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan Masalah Browser
x-i18n:
    generated_at: "2026-04-05T14:07:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Pemecahan Masalah Browser (Linux)

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

Ini BUKAN browser sungguhan - ini hanya wrapper.

### Solusi 1: Instal Google Chrome (Direkomendasikan)

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

Jika Anda harus menggunakan snap Chromium, konfigurasi OpenClaw agar terhubung ke browser yang dijalankan secara manual:

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

2. Jalankan Chromium secara manual:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Secara opsional buat service pengguna systemd untuk memulai Chrome secara otomatis:

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

### Referensi Config

| Option                   | Deskripsi                                                            | Default                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Aktifkan kontrol browser                                             | `true`                                                      |
| `browser.executablePath` | Path ke biner browser berbasis Chromium (Chrome/Brave/Edge/Chromium) | terdeteksi otomatis (mengutamakan browser default jika berbasis Chromium) |
| `browser.headless`       | Jalankan tanpa GUI                                                   | `false`                                                     |
| `browser.noSandbox`      | Tambahkan flag `--no-sandbox` (diperlukan untuk beberapa setup Linux) | `false`                                                     |
| `browser.attachOnly`     | Jangan luncurkan browser, hanya hubungkan ke yang sudah ada          | `false`                                                     |
| `browser.cdpPort`        | Port Chrome DevTools Protocol                                        | `18800`                                                     |

### Masalah: "No Chrome tabs found for profile=\"user\""

Anda sedang menggunakan profil `existing-session` / Chrome MCP. OpenClaw dapat melihat Chrome lokal,
tetapi tidak ada tab terbuka yang tersedia untuk dihubungkan.

Opsi perbaikan:

1. **Gunakan browser terkelola:** `openclaw browser start --browser-profile openclaw`
   (atau setel `browser.defaultProfile: "openclaw"`).
2. **Gunakan Chrome MCP:** pastikan Chrome lokal berjalan dengan setidaknya satu tab terbuka, lalu coba lagi dengan `--browser-profile user`.

Catatan:

- `user` hanya untuk host. Untuk server Linux, container, atau host jarak jauh, utamakan profil CDP.
- `user` / profil `existing-session` lainnya mempertahankan batasan Chrome MCP saat ini:
  aksi berbasis ref, hook upload satu file, tidak ada override timeout dialog, tidak ada
  `wait --load networkidle`, serta tidak ada `responsebody`, ekspor PDF, intersepsi
  unduhan, atau aksi batch.
- Profil `openclaw` lokal secara otomatis menetapkan `cdpPort`/`cdpUrl`; setel itu hanya untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk discovery `/json/version`, atau WS(S) saat layanan browser
  Anda memberi URL socket DevTools langsung.
