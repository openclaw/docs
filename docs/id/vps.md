---
read_when:
    - Anda ingin menjalankan Gateway di server Linux atau VPS cloud
    - Anda memerlukan panduan ringkas untuk panduan hosting
    - Anda menginginkan penyetelan server Linux generik untuk OpenClaw
sidebarTitle: Linux Server
summary: Jalankan OpenClaw di server Linux atau VPS cloud — pemilih penyedia, arsitektur, dan penyetelan
title: Server Linux
x-i18n:
    generated_at: "2026-07-12T14:48:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Jalankan Gateway OpenClaw pada server Linux atau VPS cloud apa pun. Halaman ini membantu Anda
memilih penyedia, menjelaskan cara kerja penerapan cloud, dan membahas penyetelan Linux
umum yang berlaku di semua lingkungan.

## Pilih penyedia

<CardGroup cols={2}>
  <Card title="Azure" href="/id/install/azure">VM Linux</Card>
  <Card title="DigitalOcean" href="/id/install/digitalocean">VPS berbayar sederhana</Card>
  <Card title="exe.dev" href="/id/install/exe-dev">VM dengan proksi HTTPS</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/id/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Docker pada VPS Hetzner</Card>
  <Card title="Hostinger" href="/id/install/hostinger">VPS dengan penyiapan sekali klik</Card>
  <Card title="Northflank" href="/id/install/northflank">Penyiapan sekali klik melalui peramban</Card>
  <Card title="Oracle Cloud" href="/id/install/oracle">Tingkat ARM Always Free</Card>
  <Card title="Railway" href="/id/install/railway">Penyiapan sekali klik melalui peramban</Card>
  <Card title="Raspberry Pi" href="/id/install/raspberry-pi">ARM yang dihos sendiri</Card>
</CardGroup>

**AWS (EC2 / Lightsail / tingkat gratis)** juga berfungsi dengan baik.
Panduan video dari komunitas tersedia di
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(sumber daya komunitas—mungkin tidak lagi tersedia).

## Cara kerja penyiapan cloud

- **Gateway berjalan pada VPS** serta mengelola status + ruang kerja.
- Anda terhubung dari laptop atau ponsel melalui **antarmuka kontrol** atau **Tailscale/SSH**.
- Perlakukan VPS sebagai sumber kebenaran dan **cadangkan** status + ruang kerja secara rutin.
- Setelan aman bawaan: pertahankan Gateway pada local loopback dan akses melalui terowongan SSH atau Tailscale Serve.
  Jika Anda mengikatnya ke `lan` atau `tailnet`, Gateway memerlukan rahasia bersama
  (`gateway.auth.token` atau `gateway.auth.password`), kecuali autentikasi didelegasikan kepada
  proksi tepercaya.

Halaman terkait: [Akses jarak jauh Gateway](/id/gateway/remote), [Pusat platform](/id/platforms).

## Perkuat akses administratif terlebih dahulu

Sebelum memasang OpenClaw pada VPS publik, tentukan cara Anda ingin mengelola
mesin itu sendiri.

- Untuk akses administratif khusus Tailnet: pasang Tailscale terlebih dahulu, hubungkan VPS ke
  tailnet Anda, verifikasi sesi SSH kedua melalui alamat IP Tailscale atau nama MagicDNS,
  lalu batasi SSH publik.
- Tanpa Tailscale: terapkan penguatan yang setara pada jalur SSH Anda sebelum
  mengekspos lebih banyak layanan.
- Ini terpisah dari akses Gateway. Anda tetap dapat mempertahankan OpenClaw agar terikat ke
  local loopback dan menggunakan terowongan SSH atau Tailscale Serve untuk dasbor.

Opsi Gateway khusus Tailscale tersedia di [Tailscale](/id/gateway/tailscale).

## Agen bersama perusahaan pada VPS

Menjalankan satu agen untuk sebuah tim merupakan penyiapan yang valid jika setiap pengguna berada dalam
batas kepercayaan yang sama dan agen hanya digunakan untuk keperluan bisnis.

- Pertahankan agen pada lingkungan eksekusi khusus (VPS/VM/kontainer + pengguna/akun OS khusus).
- Jangan masuk ke akun Apple/Google pribadi atau profil peramban/pengelola kata sandi pribadi dari lingkungan eksekusi tersebut.
- Jika pengguna saling berpotensi menyerang, pisahkan berdasarkan Gateway/host/pengguna OS.

Detail model keamanan: [Keamanan](/id/gateway/security).

## Menggunakan Node dengan VPS

Anda dapat mempertahankan Gateway di cloud dan memasangkan **Node** pada perangkat lokal
(Mac/iOS/Android/tanpa antarmuka grafis). Node menyediakan kemampuan layar/kamera/kanvas lokal dan `system.run`
sementara Gateway tetap berada di cloud.

Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

## Penyetelan awal untuk VM kecil dan host ARM

Jika perintah CLI terasa lambat pada VM berdaya rendah (atau host ARM), aktifkan cache kompilasi modul Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mempercepat waktu mulai perintah berulang; eksekusi pertama menghangatkan cache.
- `OPENCLAW_NO_RESPAWN=1` mempertahankan pemulaian ulang rutin Gateway dalam proses yang sama, sehingga menghindari serah terima proses tambahan dan menyederhanakan pelacakan PID pada host kecil.
- Untuk detail khusus Raspberry Pi, lihat [Raspberry Pi](/id/install/raspberry-pi).

### Daftar periksa penyetelan systemd (opsional)

Untuk host VM yang menggunakan `systemd`, pertimbangkan:

- Variabel lingkungan layanan untuk jalur awal yang stabil: `OPENCLAW_NO_RESPAWN=1` dan
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Perilaku mulai ulang eksplisit: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Disk berbasis SSD untuk jalur status/cache guna mengurangi penalti mulai dingin dari I/O acak.

Jalur standar `openclaw onboard --install-daemon` memasang unit pengguna systemd;
edit dengan:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Jika Anda sengaja memasang unit sistem, edit melalui
`sudo systemctl edit openclaw-gateway.service`.

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd dapat mengotomatiskan pemulihan layanan](https://www.redhat.com/en/blog/systemd-automate-recovery).

Untuk perilaku OOM Linux, pemilihan proses anak sebagai korban, dan diagnostik `exit 137`,
lihat [Tekanan memori Linux dan penghentian OOM](/id/platforms/linux#memory-pressure-and-oom-kills).

## Terkait

- [Ikhtisar pemasangan](/id/install)
- [DigitalOcean](/id/install/digitalocean)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
