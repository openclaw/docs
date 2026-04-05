---
read_when:
    - Menginstal OpenClaw di Windows
    - Memilih antara Windows native dan WSL2
    - Mencari status aplikasi pendamping Windows
summary: 'Dukungan Windows: jalur instalasi native dan WSL2, daemon, dan keterbatasan saat ini'
title: Windows
x-i18n:
    generated_at: "2026-04-05T14:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw mendukung **Windows native** dan **WSL2**. WSL2 adalah jalur yang lebih
stabil dan direkomendasikan untuk pengalaman penuh — CLI, Gateway, dan
tooling berjalan di dalam Linux dengan kompatibilitas penuh. Windows native berfungsi untuk
penggunaan inti CLI dan Gateway, dengan beberapa keterbatasan yang dicatat di bawah.

Aplikasi pendamping Windows native direncanakan.

## WSL2 (direkomendasikan)

- [Getting Started](/start/getting-started) (gunakan di dalam WSL)
- [Instalasi & pembaruan](/install/updating)
- Panduan resmi WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status Windows native

Alur CLI Windows native terus membaik, tetapi WSL2 tetap menjadi jalur yang direkomendasikan.

Yang saat ini berfungsi dengan baik di Windows native:

- installer situs web melalui `install.ps1`
- penggunaan CLI lokal seperti `openclaw --version`, `openclaw doctor`, dan `openclaw plugins list --json`
- smoke embedded local-agent/provider seperti:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Keterbatasan saat ini:

- `openclaw onboard --non-interactive` masih mengharapkan gateway lokal yang dapat dijangkau kecuali Anda meneruskan `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` dan `openclaw gateway install` mencoba Windows Scheduled Tasks terlebih dahulu
- jika pembuatan Scheduled Task ditolak, OpenClaw akan fallback ke item login Startup-folder per pengguna dan langsung memulai gateway
- jika `schtasks` sendiri macet atau berhenti merespons, OpenClaw sekarang membatalkan jalur itu dengan cepat dan melakukan fallback alih-alih hang selamanya
- Scheduled Tasks tetap lebih disukai jika tersedia karena memberikan status supervisor yang lebih baik

Jika Anda hanya menginginkan CLI native, tanpa instalasi layanan gateway, gunakan salah satu dari ini:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jika Anda memang menginginkan startup terkelola di Windows native:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jika pembuatan Scheduled Task diblokir, mode layanan fallback tetap akan auto-start setelah login melalui folder Startup pengguna saat ini.

## Gateway

- [Runbook Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instalasi layanan Gateway (CLI)

Di dalam WSL2:

```
openclaw onboard --install-daemon
```

Atau:

```
openclaw gateway install
```

Atau:

```
openclaw configure
```

Pilih **Gateway service** saat diminta.

Perbaiki/migrasikan:

```
openclaw doctor
```

## Gateway auto-start sebelum login Windows

Untuk penyiapan headless, pastikan seluruh rantai boot berjalan bahkan saat tidak ada yang login ke
Windows.

### 1) Biarkan layanan pengguna tetap berjalan tanpa login

Di dalam WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Instal layanan pengguna gateway OpenClaw

Di dalam WSL:

```bash
openclaw gateway install
```

### 3) Mulai WSL secara otomatis saat boot Windows

Di PowerShell sebagai Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Ganti `Ubuntu` dengan nama distro Anda dari:

```powershell
wsl --list --verbose
```

### Verifikasi rantai startup

Setelah reboot (sebelum sign-in Windows), periksa dari WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Lanjutan: ekspos layanan WSL melalui LAN (portproxy)

WSL memiliki jaringan virtualnya sendiri. Jika mesin lain perlu menjangkau layanan
yang berjalan **di dalam WSL** (SSH, server TTS lokal, atau Gateway), Anda harus
meneruskan port Windows ke IP WSL saat ini. IP WSL berubah setelah restart,
jadi Anda mungkin perlu menyegarkan aturan penerusan.

Contoh (PowerShell **sebagai Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Izinkan port tersebut melalui Windows Firewall (sekali saja):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Segarkan portproxy setelah WSL restart:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Catatan:

- SSH dari mesin lain menargetkan **IP host Windows** (contoh: `ssh user@windows-host -p 2222`).
- Node remote harus menunjuk ke URL Gateway yang **dapat dijangkau** (bukan `127.0.0.1`); gunakan
  `openclaw status --all` untuk mengonfirmasi.
- Gunakan `listenaddress=0.0.0.0` untuk akses LAN; `127.0.0.1` membuatnya tetap hanya lokal.
- Jika Anda ingin ini otomatis, daftarkan Scheduled Task untuk menjalankan langkah refresh
  saat login.

## Instalasi WSL2 langkah demi langkah

### 1) Instal WSL2 + Ubuntu

Buka PowerShell (Admin):

```powershell
wsl --install
# Atau pilih distro secara eksplisit:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reboot jika Windows memintanya.

### 2) Aktifkan systemd (diperlukan untuk instalasi gateway)

Di terminal WSL Anda:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Lalu dari PowerShell:

```powershell
wsl --shutdown
```

Buka kembali Ubuntu, lalu verifikasi:

```bash
systemctl --user status
```

### 3) Instal OpenClaw (di dalam WSL)

Ikuti alur Getting Started Linux di dalam WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # otomatis menginstal dependensi UI saat pertama kali dijalankan
pnpm build
openclaw onboard
```

Panduan lengkap: [Getting Started](/start/getting-started)

## Aplikasi pendamping Windows

Kami belum memiliki aplikasi pendamping Windows. Kontribusi diterima jika Anda ingin
mewujudkannya.
