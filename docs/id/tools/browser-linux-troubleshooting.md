---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Perbaiki masalah startup CDP Chrome/Brave/Edge/Chromium untuk kontrol browser OpenClaw di Linux
title: Pemecahan masalah browser
x-i18n:
    generated_at: "2026-04-24T09:29:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Masalah: "Failed to start Chrome CDP on port 18800"

Server kontrol browser OpenClaw gagal meluncurkan Chrome/Brave/Edge/Chromium dengan kesalahan:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Penyebab akar

Di Ubuntu (dan banyak distro Linux), instalasi Chromium default adalah **paket snap**. Confinement AppArmor milik snap mengganggu cara OpenClaw memunculkan dan memantau proses browser.

Perintah `apt install chromium` menginstal paket stub yang mengalihkan ke snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Ini BUKAN browser sungguhan - ini hanya wrapper.

### Solusi 1: Instal Google Chrome (Direkomendasikan)

Instal paket `.deb` resmi Google Chrome, yang tidak disandbox oleh snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # jika ada kesalahan dependensi
```

Lalu perbarui konfigurasi OpenClaw Anda (`~/.openclaw/openclaw.json`):

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

### Solusi 2: Gunakan Snap Chromium dengan mode Attach-Only

Jika Anda harus menggunakan snap Chromium, konfigurasikan OpenClaw agar terhubung ke browser yang dijalankan secara manual:

1. Perbarui konfigurasi:

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

3. Secara opsional buat layanan pengguna systemd untuk memulai Chrome secara otomatis:

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

### Memverifikasi browser berfungsi

Periksa status:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Uji penelusuran:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Referensi konfigurasi

| Opsi                     | Deskripsi                                                            | Default                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Mengaktifkan kontrol browser                                         | `true`                                                      |
| `browser.executablePath` | Path ke biner browser berbasis Chromium (Chrome/Brave/Edge/Chromium) | terdeteksi otomatis (memprioritaskan browser default jika berbasis Chromium) |
| `browser.headless`       | Menjalankan tanpa GUI                                                | `false`                                                     |
| `browser.noSandbox`      | Menambahkan flag `--no-sandbox` (diperlukan untuk beberapa penyiapan Linux) | `false`                                                     |
| `browser.attachOnly`     | Jangan meluncurkan browser, hanya hubungkan ke yang sudah ada        | `false`                                                     |
| `browser.cdpPort`        | Port Chrome DevTools Protocol                                        | `18800`                                                     |

### Masalah: "No Chrome tabs found for profile=\"user\""

Anda menggunakan profil `existing-session` / Chrome MCP. OpenClaw dapat melihat Chrome lokal,
tetapi tidak ada tab terbuka yang tersedia untuk dihubungkan.

Opsi perbaikan:

1. **Gunakan browser yang dikelola:** `openclaw browser start --browser-profile openclaw`
   (atau tetapkan `browser.defaultProfile: "openclaw"`).
2. **Gunakan Chrome MCP:** pastikan Chrome lokal sedang berjalan dengan setidaknya satu tab terbuka, lalu coba lagi dengan `--browser-profile user`.

Catatan:

- `user` hanya untuk host. Untuk server Linux, container, atau host jarak jauh, gunakan profil CDP.
- Profil `user` / `existing-session` lainnya mempertahankan batas Chrome MCP saat ini:
  tindakan berbasis ref, hook unggah satu file, tidak ada override timeout dialog, tidak ada
  `wait --load networkidle`, serta tidak ada `responsebody`, ekspor PDF, intersepsi unduhan, atau tindakan batch.
- Profil `openclaw` lokal secara otomatis menetapkan `cdpPort`/`cdpUrl`; tetapkan itu hanya untuk CDP jarak jauh.
- Profil CDP jarak jauh menerima `http://`, `https://`, `ws://`, dan `wss://`.
  Gunakan HTTP(S) untuk penemuan `/json/version`, atau WS(S) saat layanan browser Anda
  memberikan URL socket DevTools langsung.

## Terkait

- [Browser](/id/tools/browser)
- [Login browser](/id/tools/browser-login)
- [Pemecahan masalah browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
