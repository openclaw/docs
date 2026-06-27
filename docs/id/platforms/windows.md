---
read_when:
    - Menginstal OpenClaw di Windows
    - Memilih antara Windows Hub, Windows native, dan WSL2
    - Menyiapkan aplikasi pendamping Windows atau mode node Windows
summary: 'Dukungan Windows: Windows Hub, CLI dan Gateway native, penyiapan gateway WSL2, mode node, dan pemecahan masalah'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:43:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw menyertakan aplikasi pendamping **Windows Hub** native serta dukungan CLI Windows.
Gunakan Windows Hub saat Anda menginginkan aplikasi desktop dengan penyiapan, status baki, chat,
diagnostik Command Center, dan kapabilitas Node Windows. Gunakan penginstal PowerShell
saat Anda menginginkan CLI/Gateway secara langsung. Gunakan WSL2 saat Anda menginginkan
runtime Gateway yang paling kompatibel dengan Linux.

## Direkomendasikan: Windows Hub

Windows Hub adalah aplikasi pendamping WinUI native untuk Windows 10 20H2+ dan Windows 11. Aplikasi ini dipasang tanpa hak administrator dan diterbitkan dengan penginstal
x64 dan ARM64 bertanda tangan pada rilis OpenClaw.

Unduh penginstal stabil terbaru dari [halaman rilis OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksum](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Jika tautan unduhan di atas mengembalikan 404, kunjungi [halaman rilis](https://github.com/openclaw/openclaw/releases) dan cari aset `OpenClawCompanion-Setup-*` pada rilis terbaru.

Setelah pemasangan, jalankan **OpenClaw Companion** dari menu Start atau baki
sistem. Penginstal juga menambahkan pintasan untuk Penyiapan Gateway, Chat, Pengaturan,
Periksa Pembaruan, dan hapus instalasi.

### Yang disertakan Windows Hub

- status baki sistem dan jalankan saat login
- penyiapan pertama kali untuk Gateway WSL lokal milik aplikasi
- pengaturan koneksi untuk Gateway lokal, jarak jauh, dan bertunnel SSH
- jendela chat native plus akses ke Control UI browser
- diagnostik Command Center untuk sesi, penggunaan, kanal, Node, pemasangan, dan
  perintah perbaikan
- mode Node Windows untuk kanvas, layar, kamera, notifikasi, status perangkat,
  text-to-speech, speech-to-text, dan `system.run` terkendali yang dikendalikan agen
- mode server MCP lokal untuk klien MCP seperti Claude Desktop, Claude Code, dan
  Cursor

### Peluncuran pertama

Pada peluncuran pertama, Windows Hub membuka penyiapan saat tidak ada Gateway tersimpan yang dapat digunakan.
Jalur tercepat adalah **Siapkan secara lokal**, yang menyediakan distro WSL
`OpenClawGateway` milik aplikasi, memasang Gateway di dalamnya, dan memasangkan aplikasi.
Ini tidak mengekspor atau mengubah distro Ubuntu Anda yang sudah ada.

Pilih **Penyiapan lanjutan** atau buka tab Koneksi saat Anda sudah memiliki
Gateway. Anda dapat terhubung ke:

- Gateway lokal di PC ini
- Gateway WSL di PC ini
- Gateway jarak jauh melalui URL dan token atau kode penyiapan
- Gateway yang dijangkau melalui tunnel SSH

Saat penyiapan selesai, ikon baki berubah hijau. Buka **Command Center** dari
baki untuk mengonfirmasi koneksi, pemasangan, status Node, dan kesehatan kanal.

## Mode Node Windows

Windows Hub dapat mendaftar sebagai Node OpenClaw kelas pertama. Agen kemudian dapat menggunakan
kapabilitas native Windows yang dideklarasikan melalui Gateway.

Perintah umum mencakup:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` dan, dengan opt-in eksplisit, `screen.record`
- `camera.list` dan, dengan opt-in eksplisit, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Mode Node memerlukan pemasangan Gateway. Jika aplikasi menampilkan permintaan pemasangan, setujui
permintaan tersebut dari host Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway hanya meneruskan perintah yang dideklarasikan Node dan diizinkan kebijakan server.
Perintah sensitif privasi seperti `screen.record`, `camera.snap`, dan
`camera.clip` memerlukan opt-in eksplisit `gateway.nodes.allowCommands`.

## Mode MCP lokal

Windows Hub dapat mengekspos registri kapabilitas native Windows yang sama sebagai server
MCP lokal pada loopback. Ini berguna saat Anda ingin klien MCP lokal menggerakkan
kapabilitas Windows tanpa Gateway OpenClaw yang sedang berjalan.

Aktifkan di Pengaturan Windows Hub pada bagian pengembang/lanjutan. Aplikasi
menampilkan endpoint loopback dan bearer token setelah server diaktifkan.

Matriks mode:

| Mode Node | Server MCP | Perilaku                           |
| --------- | ---------- | ---------------------------------- |
| mati      | mati       | Aplikasi desktop khusus operator   |
| hidup     | mati       | Node Windows yang terhubung Gateway |
| mati      | hidup      | Hanya server MCP lokal             |
| hidup     | hidup      | Node Gateway plus server MCP lokal |

## CLI dan Gateway Windows native

Untuk penggunaan yang berpusat pada terminal, pasang OpenClaw dari PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifikasi:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Alur CLI dan Gateway Windows native didukung dan terus ditingkatkan.
Startup terkelola menggunakan Windows Scheduled Tasks saat tersedia. Tugas mempertahankan
skrip `gateway.cmd` yang dapat dibaca di direktori status OpenClaw, tetapi menjalankannya melalui
wrapper WScript `gateway.vbs` yang dihasilkan agar Gateway latar belakang tidak membuka
jendela konsol yang terlihat. Jika pembuatan tugas ditolak, OpenClaw beralih ke item login
folder Startup per pengguna.

Untuk memasang layanan Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Jika Anda hanya ingin menggunakan CLI tanpa layanan Gateway terkelola:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 tetap menjadi runtime Gateway yang paling kompatibel dengan Linux di Windows. Windows Hub
dapat menyiapkan Gateway WSL milik aplikasi untuk Anda, atau Anda dapat memasangnya secara manual di dalam
distro Anda sendiri.

Penyiapan manual:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Aktifkan systemd di dalam WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Mulai ulang WSL dari PowerShell:

```powershell
wsl --shutdown
```

Lalu pasang OpenClaw di dalam WSL dengan quickstart Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Mulai otomatis Gateway sebelum login Windows

Untuk penyiapan WSL headless, pastikan seluruh rantai boot berjalan bahkan saat tidak ada yang login
ke Windows.

Di dalam WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

Di PowerShell sebagai Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Ganti `Ubuntu` dengan nama distro Anda dari:

```powershell
wsl --list --verbose
```

> **Catatan:** Dua perubahan dari resep lama:
>
> - **`dbus-launch true` alih-alih `/bin/true`** — Pada WSL ≥ 2.6.1.0, regresi ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) menyebabkan distro dihentikan saat idle 15–20 detik setelah klien terakhir keluar, bahkan dengan linger diaktifkan. `dbus-launch true` menjaga proses child-of-init tetap hidup sebagai solusi sementara ([diskusi komunitas, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` alih-alih `/ru SYSTEM`** — Distro WSL per pengguna (penyiapan default) tidak terlihat oleh akun SYSTEM; tugas tampak berjalan tetapi distro tidak pernah dimulai. Menjalankannya sebagai akun Anda sendiri menghindari hal ini. Windows akan meminta kata sandi Anda saat tugas dibuat.

Setelah reboot, verifikasi dari WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Ekspos layanan WSL melalui LAN

WSL memiliki jaringan virtualnya sendiri. Jika mesin lain harus menjangkau layanan di dalam
WSL, teruskan port Windows ke IP WSL saat ini. IP WSL dapat berubah setelah
restart, jadi segarkan aturan penerusan bila diperlukan.

Contoh di PowerShell sebagai Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Catatan:

- SSH dari mesin lain menargetkan IP host Windows, misalnya
  `ssh user@windows-host -p 2222`.
- Node jarak jauh harus mengarah ke URL Gateway yang dapat dijangkau, bukan `127.0.0.1`.
- Gunakan `listenaddress=0.0.0.0` untuk akses LAN. Gunakan `127.0.0.1` untuk akses
  khusus lokal.

## Pemecahan masalah

### Ikon baki tidak muncul

Periksa Task Manager untuk `OpenClaw.Tray.WinUI.exe`. Jika sedang berjalan, buka area
ikon baki tersembunyi dan sematkan. Jika tidak berjalan, jalankan **OpenClaw
Companion** dari menu Start.

### Penyiapan lokal gagal

Buka log penyiapan dari Windows Hub atau periksa:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Penyebab umum adalah WSL yang dinonaktifkan, virtualisasi yang diblokir, status WSL
milik aplikasi yang usang, atau kegagalan jaringan saat memasang paket Gateway.

### Aplikasi mengatakan pemasangan diperlukan

Setujui permintaan operator atau Node dari Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Jika perangkat sudah memiliki token, hubungkan kembali dari tab Koneksi setelah
persetujuan.

### Web chat tidak dapat menjangkau Gateway jarak jauh

Web chat jarak jauh memerlukan HTTPS atau localhost. Untuk sertifikat bertanda tangan sendiri, percayai
sertifikat di Windows, atau gunakan tunnel SSH ke URL localhost.

### `screen.snapshot`, kamera, atau perintah audio gagal

Konfirmasikan izin Windows untuk kamera, mikrofon, tangkapan layar, dan
notifikasi. Pemasangan terkemas mendeklarasikan kapabilitas terlindungi, tetapi Windows
mungkin tetap meminta konfirmasi saat pertama kali perintah menggunakannya.

### Konektivitas Git atau GitHub gagal

Beberapa jaringan memblokir atau membatasi HTTPS ke GitHub. Jika `git clone` atau `gh auth
login` gagal, coba jaringan lain, VPN, atau proxy HTTP/HTTPS.

Untuk auth `gh` berbasis token dalam sesi saat ini:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Jangan pernah commit token atau menempelkannya ke issue atau pull request.

## Terkait

- [Ikhtisar pemasangan](/id/install)
- [Penyiapan Node.js](/id/install/node)
- [Node](/id/nodes)
- [Control UI](/id/web/control-ui)
- [Konfigurasi Gateway](/id/gateway/configuration)
