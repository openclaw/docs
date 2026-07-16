---
read_when:
    - Menginstal OpenClaw di Windows
    - Memilih antara Windows Hub, Windows native, dan WSL2
    - Menyiapkan aplikasi pendamping Windows atau mode Node Windows
summary: 'Dukungan Windows: Windows Hub, CLI dan Gateway native, penyiapan Gateway WSL2, mode Node, dan pemecahan masalah'
title: Windows
x-i18n:
    generated_at: "2026-07-16T18:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw menyediakan aplikasi pendamping native **Windows Hub** beserta dukungan CLI Windows.
Gunakan Windows Hub untuk aplikasi desktop dengan penyiapan, status baki sistem, obrolan, diagnostik Command
Center, dan kemampuan node Windows. Gunakan penginstal PowerShell
untuk CLI/Gateway secara langsung. Gunakan WSL2 untuk runtime Gateway yang paling
kompatibel dengan Linux.

## Direkomendasikan: Windows Hub

Windows Hub adalah aplikasi pendamping WinUI native untuk Windows 10 20H2+ dan
Windows 11. Aplikasi ini dapat diinstal tanpa hak istimewa administrator dan menyediakan penginstal x64
dan ARM64 bertanda tangan dari halaman rilisnya sendiri.

Windows Hub diterbitkan secara independen dari CLI dan Gateway OpenClaw. Unduh
penginstal Hub stabil terbaru dari
[halaman rilis Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
atau secara langsung melalui `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Jika tautan di atas menghasilkan 404, kunjungi [halaman rilis Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
dan buka rilis Windows Hub stabil terbaru. Rilis stabil OpenClaw reguler
juga mencerminkan build Windows Hub yang disematkan dan divalidasi untuk rilis; pencerminan tersebut dapat tertinggal dari
rilis Hub mandiri yang lebih baru.

Setelah penginstalan, jalankan **OpenClaw Companion** dari menu Start atau
baki sistem. Penginstal juga menambahkan pintasan untuk Gateway Setup, Chat, Settings,
Check for Updates, dan uninstall.

### Yang disertakan Windows Hub

- Status baki sistem dan peluncuran saat masuk.
- Penyiapan saat pertama kali dijalankan untuk Gateway WSL lokal yang dimiliki aplikasi.
- Pengaturan koneksi untuk Gateway lokal, jarak jauh, dan bertunel SSH.
- Jendela obrolan native beserta akses ke Control UI berbasis peramban.
- Diagnostik Command Center untuk sesi, penggunaan, saluran, node, pemasangan,
  dan perintah perbaikan.
- Mode node Windows untuk kanvas, layar, kamera,
  notifikasi, status perangkat, percakapan, dan `system.run` terkontrol yang dikendalikan agen.
- Mode server MCP lokal untuk klien MCP seperti Claude Desktop, Claude Code,
  dan Cursor.

### Peluncuran pertama

Saat pertama kali dijalankan, Windows Hub membuka penyiapan jika tidak ada
Gateway tersimpan yang dapat digunakan. Jalur tercepat adalah **Set up locally**, yang menyediakan
distro WSL `OpenClawGateway` milik aplikasi, menginstal Gateway di dalamnya, dan
memasangkan aplikasi. Tindakan ini tidak mengekspor atau mengubah distro Ubuntu yang sudah ada.

Pilih **Advanced setup** atau buka tab Connections jika Anda sudah memiliki
Gateway. Anda dapat terhubung ke:

- Gateway lokal di PC ini
- Gateway WSL di PC ini
- Gateway jarak jauh melalui URL dan token atau kode penyiapan
- Gateway yang dijangkau melalui terowongan SSH

Setelah penyiapan selesai, ikon baki berubah menjadi hijau. Buka **Command Center** dari
baki untuk mengonfirmasi koneksi, pemasangan, status node, dan kesehatan saluran.

## Mode node Windows

Windows Hub dapat mendaftar sebagai node OpenClaw agar agen dapat menggunakan kemampuan
native Windows yang dideklarasikan melalui Gateway. Perintah node harus
dideklarasikan oleh node dan diizinkan oleh kebijakan Gateway sebelum dijalankan; lihat
[Node](/id/nodes#command-policy) untuk model izin/tolak selengkapnya.

Perintah umum:

| Kelompok | Perintah                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Kanvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Layar | `screen.snapshot`; `screen.record` memerlukan persetujuan eksplisit                          |
| Kamera | `camera.list`; `camera.snap`, `camera.clip` memerlukan persetujuan eksplisit                  |
| Sistem | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Perangkat | `location.get`, `device.info`, `device.status`                                       |
| Percakapan   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Mode node memerlukan pemasangan Gateway. Jika aplikasi menampilkan permintaan pemasangan,
setujui dari host Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway hanya meneruskan perintah yang dideklarasikan oleh node dan
diizinkan kebijakan server. Perintah yang sensitif terhadap privasi seperti `screen.record`, `camera.snap`,
dan `camera.clip` memerlukan persetujuan `gateway.nodes.allowCommands` eksplisit.

## Mode MCP lokal

Windows Hub dapat mengekspos registri kemampuan native Windows yang sama sebagai
server MCP lokal pada loopback, sehingga klien MCP lokal dapat mengendalikan kemampuan Windows
tanpa Gateway OpenClaw yang sedang berjalan.

Aktifkan di Settings Windows Hub pada bagian developer/advanced. Aplikasi
menampilkan endpoint loopback dan token bearer setelah server diaktifkan.

Matriks mode:

| Mode node | Server MCP | Perilaku                           |
| --------- | ---------- | ---------------------------------- |
| nonaktif       | nonaktif        | Aplikasi desktop khusus operator          |
| aktif        | nonaktif        | Node Windows yang terhubung ke Gateway     |
| nonaktif       | aktif         | Hanya server MCP lokal              |
| aktif        | aktif         | Node Gateway beserta server MCP lokal |

## CLI dan Gateway Windows native

Untuk penggunaan yang mengutamakan terminal, instal OpenClaw dari PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifikasi:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Startup terkelola menggunakan Windows Scheduled Tasks jika tersedia. Tugas tersebut menyimpan
skrip `gateway.cmd` yang mudah dibaca di direktori status OpenClaw, tetapi menjalankannya
melalui pembungkus WScript `gateway.vbs` yang dibuat secara otomatis, sehingga Gateway latar belakang
tidak membuka jendela konsol yang terlihat. Jika pembuatan tugas ditolak, OpenClaw
beralih ke item masuk per pengguna di folder Startup.

Instal layanan Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Untuk penggunaan khusus CLI tanpa layanan Gateway terkelola:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 tetap menjadi runtime Gateway yang paling kompatibel dengan Linux di Windows. Windows
Hub dapat menyiapkan Gateway WSL milik aplikasi untuk Anda, atau Anda dapat menginstalnya secara manual di dalam
distro sendiri.

Penyiapan manual:

```powershell
wsl --install
# Atau pilih distro secara eksplisit:
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

Kemudian instal OpenClaw di dalam WSL dengan panduan mulai cepat Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Mulai otomatis Gateway sebelum masuk ke Windows

Untuk penyiapan WSL tanpa antarmuka, pastikan seluruh rantai boot berjalan meskipun tidak ada yang
masuk ke Windows.

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

<Note>
Dua perubahan dari prosedur lama:

- **`dbus-launch true` alih-alih `/bin/true`**: pada WSL >= 2.6.1.0, sebuah
  regresi ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  menghentikan distro yang tidak aktif 15-20 detik setelah klien terakhir keluar, bahkan
  jika linger diaktifkan. `dbus-launch true` mempertahankan proses turunan init tetap berjalan
  sebagai solusi sementara (diskusi komunitas, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` alih-alih `/ru SYSTEM`**: distro WSL per pengguna (
  penyiapan default) tidak terlihat oleh akun SYSTEM, sehingga tugas tampak
  berjalan, tetapi distro tidak pernah dimulai. Menjalankannya sebagai akun Anda sendiri menghindari
  masalah ini; Windows meminta kata sandi saat tugas dibuat.

</Note>

Setelah boot ulang, verifikasi dari WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Mengekspos layanan WSL melalui LAN

WSL memiliki jaringan virtualnya sendiri. Jika komputer lain harus menjangkau layanan
di dalam WSL, teruskan port Windows ke IP WSL saat ini. IP WSL dapat
berubah setelah dimulai ulang, jadi perbarui aturan penerusan bila diperlukan.

Contoh di PowerShell sebagai Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP tidak ditemukan." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Catatan:

- SSH dari komputer lain menargetkan IP host Windows, misalnya `ssh user@windows-host -p 2222`.
- Node jarak jauh harus mengarah ke URL Gateway yang dapat dijangkau, bukan `127.0.0.1`.
- Gunakan `listenaddress=0.0.0.0` untuk akses LAN, `127.0.0.1` untuk akses khusus lokal.

## Pemecahan masalah

### Ikon baki tidak muncul

Periksa Task Manager untuk `OpenClaw.Tray.WinUI.exe`. Jika sedang berjalan, buka
area ikon baki tersembunyi dan sematkan. Jika tidak, jalankan **OpenClaw Companion** dari
menu Start.

### Penyiapan lokal gagal

Buka log penyiapan dari Windows Hub atau periksa:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Penyebab umum: WSL dinonaktifkan, virtualisasi diblokir, status WSL milik aplikasi
yang kedaluwarsa, atau kegagalan jaringan saat menginstal paket Gateway.

### Aplikasi menyatakan bahwa pemasangan diperlukan

Setujui permintaan operator atau node dari Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Jika perangkat sudah memiliki token, sambungkan kembali dari tab Connections setelah
persetujuan.

### Obrolan web tidak dapat menjangkau Gateway jarak jauh

Obrolan web jarak jauh memerlukan HTTPS atau localhost. Untuk sertifikat yang ditandatangani sendiri, percayai
sertifikat tersebut di Windows, atau gunakan terowongan SSH ke URL localhost.

### Perintah `screen.snapshot`, kamera, atau audio gagal

Konfirmasikan izin Windows untuk kamera, mikrofon, perekaman layar, dan
notifikasi. Penginstalan dalam paket mendeklarasikan kemampuan yang dilindungi, tetapi
Windows mungkin tetap meminta izin saat perintah menggunakannya untuk pertama kali.

### Konektivitas Git atau GitHub gagal

Beberapa jaringan memblokir atau membatasi HTTPS ke GitHub. Jika `git clone` atau
`gh auth login` gagal, coba jaringan lain, VPN, atau proksi HTTP/HTTPS.

Untuk autentikasi `gh` berbasis token pada sesi saat ini:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Jangan pernah melakukan commit token atau menempelkannya ke issue atau pull request.

## Terkait

- [Ringkasan penginstalan](/id/install)
- [Penyiapan Node.js](/id/install/node)
- [Node](/id/nodes)
- [Control UI](/id/web/control-ui)
- [Konfigurasi Gateway](/id/gateway/configuration)
