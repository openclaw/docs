---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Penyiapan tunnel SSH untuk OpenClaw.app yang terhubung ke gateway jarak jauh
title: Penyiapan Gateway Jarak Jauh
x-i18n:
    generated_at: "2026-04-05T13:54:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55467956a3473fa36709715f017369471428f7566132f7feb47581caa98b4600
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Konten ini telah digabungkan ke [Akses Jarak Jauh](/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Lihat halaman tersebut untuk panduan terbaru.

# Menjalankan OpenClaw.app dengan Gateway Jarak Jauh

OpenClaw.app menggunakan tunneling SSH untuk terhubung ke gateway jarak jauh. Panduan ini menunjukkan cara menyiapkannya.

## Gambaran umum

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Penyiapan cepat

### Langkah 1: Tambahkan config SSH

Edit `~/.ssh/config` dan tambahkan:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # misalnya, 172.27.187.184
    User <REMOTE_USER>            # misalnya, jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Ganti `<REMOTE_IP>` dan `<REMOTE_USER>` dengan nilai Anda.

### Langkah 2: Salin kunci SSH

Salin kunci publik Anda ke mesin jarak jauh (masukkan kata sandi sekali):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Langkah 3: Konfigurasikan auth gateway jarak jauh

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Gunakan `gateway.remote.password` sebagai gantinya jika gateway jarak jauh Anda menggunakan auth kata sandi.
`OPENCLAW_GATEWAY_TOKEN` tetap valid sebagai override tingkat shell, tetapi
penyiapan klien jarak jauh yang tahan lama adalah `gateway.remote.token` / `gateway.remote.password`.

### Langkah 4: Mulai tunnel SSH

```bash
ssh -N remote-gateway &
```

### Langkah 5: Mulai ulang OpenClaw.app

```bash
# Keluar dari OpenClaw.app (⌘Q), lalu buka kembali:
open /path/to/OpenClaw.app
```

Aplikasi sekarang akan terhubung ke gateway jarak jauh melalui tunnel SSH.

---

## Mulai tunnel otomatis saat login

Agar tunnel SSH dimulai secara otomatis saat Anda login, buat Launch Agent.

### Buat file PLIST

Simpan ini sebagai `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Muat Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunnel sekarang akan:

- Dimulai secara otomatis saat Anda login
- Dimulai ulang jika crash
- Tetap berjalan di latar belakang

Catatan lama: hapus LaunchAgent `com.openclaw.ssh-tunnel` yang tersisa jika ada.

---

## Pemecahan masalah

**Periksa apakah tunnel sedang berjalan:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Mulai ulang tunnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Hentikan tunnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Cara kerjanya

| Component                            | What It Does                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Meneruskan port lokal 18789 ke port jarak jauh 18789               |
| `ssh -N`                             | SSH tanpa menjalankan perintah jarak jauh (hanya penerusan port) |
| `KeepAlive`                          | Secara otomatis memulai ulang tunnel jika crash                  |
| `RunAtLoad`                          | Memulai tunnel saat agent dimuat                           |

OpenClaw.app terhubung ke `ws://127.0.0.1:18789` di mesin klien Anda. Tunnel SSH meneruskan koneksi tersebut ke port 18789 di mesin jarak jauh tempat Gateway berjalan.
