---
read_when:
    - Menginstal OpenClaw di Windows
    - Memilih antara Windows asli dan WSL2
    - Mencari status aplikasi pendamping Windows
summary: 'Dukungan Windows: jalur instalasi native dan WSL2, daemon, serta catatan penting saat ini'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw mendukung **Windows native** dan **WSL2**. WSL2 adalah jalur yang lebih
stabil dan direkomendasikan untuk pengalaman penuh — CLI, Gateway, dan
tooling berjalan di dalam Linux dengan kompatibilitas penuh. Windows native berfungsi untuk
penggunaan CLI inti dan Gateway, dengan beberapa catatan di bawah.

Aplikasi pendamping Windows native direncanakan.

## WSL2 (direkomendasikan)

- [Memulai](/id/start/getting-started) (gunakan di dalam WSL)
- [Instal & pembaruan](/id/install/updating)
- Panduan resmi WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Status Windows native

Alur CLI Windows native sedang membaik, tetapi WSL2 masih menjadi jalur yang direkomendasikan.

Yang berfungsi baik di Windows native saat ini:

- penginstal situs web melalui `install.ps1`
- penggunaan CLI lokal seperti `openclaw --version`, `openclaw doctor`, dan `openclaw plugins list --json`
- smoke lokal-agent/provider tertanam seperti:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Catatan saat ini:

- `openclaw onboard --non-interactive` masih mengharapkan gateway lokal yang dapat dijangkau kecuali Anda meneruskan `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` dan `openclaw gateway install` mencoba Windows Scheduled Tasks terlebih dahulu
- jika pembuatan Scheduled Task ditolak, OpenClaw beralih ke item login folder Startup per pengguna dan segera memulai gateway
- jika `schtasks` sendiri macet atau berhenti merespons, OpenClaw kini membatalkan jalur itu dengan cepat dan beralih alih-alih menggantung selamanya
- Scheduled Tasks tetap diprioritaskan saat tersedia karena memberikan status supervisor yang lebih baik

Jika Anda hanya menginginkan CLI native, tanpa instal layanan gateway, gunakan salah satu ini:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Jika Anda memang menginginkan startup terkelola di Windows native:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jika pembuatan Scheduled Task diblokir, mode layanan fallback tetap otomatis dimulai setelah login melalui folder Startup pengguna saat ini.

## Gateway

- [Runbook Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instal layanan Gateway (CLI)

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

Pilih **Layanan Gateway** saat diminta.

Perbaiki/migrasikan:

```
openclaw doctor
```

## Mulai otomatis Gateway sebelum login Windows

Untuk setup headless, pastikan seluruh rantai boot berjalan bahkan ketika tidak ada yang login ke
Windows.

### 1) Biarkan layanan pengguna berjalan tanpa login

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

Setelah reboot (sebelum masuk ke Windows), periksa dari WSL:

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

Izinkan port melalui Windows Firewall (sekali saja):

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
- Node jarak jauh harus menunjuk ke URL Gateway yang **dapat dijangkau** (bukan `127.0.0.1`); gunakan
  `openclaw status --all` untuk mengonfirmasi.
- Gunakan `listenaddress=0.0.0.0` untuk akses LAN; `127.0.0.1` menjaganya tetap lokal saja.
- Jika Anda ingin ini otomatis, daftarkan Scheduled Task untuk menjalankan langkah
  penyegaran saat login.

## Instal WSL2 langkah demi langkah

### 1) Instal WSL2 + Ubuntu

Buka PowerShell (Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Reboot jika Windows meminta.

### 2) Aktifkan systemd (diperlukan untuk instal gateway)

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

Buka ulang Ubuntu, lalu verifikasi:

```bash
systemctl --user status
```

### 3) Instal OpenClaw (di dalam WSL)

Untuk setup pertama kali yang normal di dalam WSL, ikuti alur Memulai Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Jika Anda mengembangkan dari source alih-alih melakukan onboarding pertama kali, gunakan
loop pengembangan source dari [Setup](/id/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Panduan lengkap: [Memulai](/id/start/getting-started)

## Aplikasi pendamping Windows

Kami belum memiliki aplikasi pendamping Windows. Kontribusi diterima jika Anda ingin
membantu mewujudkannya.

## Konektivitas Git dan GitHub (kontributor)

Beberapa jaringan memblokir atau membatasi HTTPS ke GitHub. Jika `git clone` gagal karena timeout
atau koneksi direset, coba jaringan lain, VPN, atau proxy HTTP/HTTPS yang disediakan
organisasi Anda.

Jika `gh auth login` gagal selama alur perangkat browser (misalnya timeout
saat menjangkau `github.com:443`), autentikasi dengan token akses pribadi sebagai gantinya:

1. Buat token dengan setidaknya scope `repo` (PAT klasik) atau akses fine-grained
   yang setara.
2. Di PowerShell untuk sesi saat ini:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. Jika `gh auth status` memperingatkan tentang `read:org` yang hilang, buat token yang mencakup
   scope tersebut dan tetapkan ulang variabel:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` hanya berlaku saat Anda mengautentikasi melalui `gh auth login`
dan memiliki kredensial tersimpan untuk disegarkan (bukan saat menggunakan `GH_TOKEN`).

Jangan pernah commit token atau menempelkannya ke issue atau pull request.

## Terkait

- [Ikhtisar instal](/id/install)
- [Platform](/id/platforms)
