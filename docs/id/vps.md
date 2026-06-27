---
read_when:
    - Anda ingin menjalankan Gateway di server Linux atau VPS cloud
    - Anda memerlukan gambaran singkat tentang panduan hosting
    - Anda menginginkan penyetelan server Linux generik untuk OpenClaw
sidebarTitle: Linux Server
summary: Jalankan OpenClaw di server Linux atau VPS cloud — pemilih penyedia, arsitektur, dan penyetelan
title: Server Linux
x-i18n:
    generated_at: "2026-06-27T18:23:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Jalankan OpenClaw Gateway di server Linux atau VPS cloud mana pun. Halaman ini membantu Anda
memilih penyedia, menjelaskan cara kerja deployment cloud, dan membahas tuning Linux
generik yang berlaku di mana saja.

## Pilih penyedia

<CardGroup cols={2}>
  <Card title="Railway" href="/id/install/railway">Penyiapan sekali klik, melalui browser</Card>
  <Card title="Northflank" href="/id/install/northflank">Penyiapan sekali klik, melalui browser</Card>
  <Card title="DigitalOcean" href="/id/install/digitalocean">VPS berbayar sederhana</Card>
  <Card title="Oracle Cloud" href="/id/install/oracle">Tier ARM Always Free</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Docker di VPS Hetzner</Card>
  <Card title="Hostinger" href="/id/install/hostinger">VPS dengan penyiapan sekali klik</Card>
  <Card title="GCP" href="/id/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/id/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/id/install/exe-dev">VM dengan proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/id/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** juga berfungsi dengan baik.
Panduan video dari komunitas tersedia di
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(sumber daya komunitas -- mungkin menjadi tidak tersedia).

## Cara kerja penyiapan cloud

- **Gateway berjalan di VPS** dan memiliki state + workspace.
- Anda terhubung dari laptop atau ponsel melalui **UI Kontrol** atau **Tailscale/SSH**.
- Perlakukan VPS sebagai sumber kebenaran dan **cadangkan** state + workspace secara rutin.
- Default aman: biarkan Gateway di loopback dan akses melalui tunnel SSH atau Tailscale Serve.
  Jika Anda bind ke `lan` atau `tailnet`, wajibkan `gateway.auth.token` atau `gateway.auth.password`.

Halaman terkait: [Akses jarak jauh Gateway](/id/gateway/remote), [Hub platform](/id/platforms).

## Perkeras akses admin terlebih dahulu

Sebelum memasang OpenClaw di VPS publik, putuskan bagaimana Anda ingin mengelola
mesin itu sendiri.

- Jika Anda menginginkan akses admin hanya Tailnet, pasang Tailscale terlebih dahulu, gabungkan VPS
  ke tailnet Anda, verifikasi sesi SSH kedua melalui IP Tailscale atau
  nama MagicDNS, lalu batasi SSH publik.
- Jika Anda tidak menggunakan Tailscale, terapkan penguatan yang setara untuk jalur SSH
  Anda sebelum mengekspos layanan lain.
- Ini terpisah dari akses Gateway. Anda masih dapat menjaga OpenClaw tetap bind ke
  loopback dan menggunakan tunnel SSH atau Tailscale Serve untuk dasbor.

Opsi Gateway khusus Tailscale ada di [Tailscale](/id/gateway/tailscale).

## Agen perusahaan bersama di VPS

Menjalankan satu agen untuk tim adalah penyiapan yang valid ketika setiap pengguna berada dalam batas kepercayaan yang sama dan agen hanya untuk bisnis.

- Simpan di runtime khusus (VPS/VM/container + pengguna/akun OS khusus).
- Jangan masuk ke runtime itu dengan akun Apple/Google pribadi atau profil browser/pengelola kata sandi pribadi.
- Jika pengguna saling adversarial, pisahkan berdasarkan gateway/host/pengguna OS.

Detail model keamanan: [Keamanan](/id/gateway/security).

## Menggunakan node dengan VPS

Anda dapat menyimpan Gateway di cloud dan memasangkan **node** di perangkat lokal Anda
(Mac/iOS/Android/headless). Node menyediakan kemampuan layar/kamera/kanvas lokal dan `system.run`
sementara Gateway tetap berada di cloud.

Dokumentasi: [Node](/id/nodes), [CLI Node](/id/cli/nodes).

## Tuning startup untuk VM kecil dan host ARM

Jika perintah CLI terasa lambat di VM berdaya rendah (atau host ARM), aktifkan cache kompilasi modul Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mempercepat waktu startup perintah berulang.
- `OPENCLAW_NO_RESPAWN=1` mempertahankan restart Gateway rutin dalam proses, sehingga menghindari handoff proses tambahan dan menjaga pelacakan PID tetap sederhana di host kecil.
- Eksekusi perintah pertama menghangatkan cache; eksekusi berikutnya lebih cepat.
- Untuk detail khusus Raspberry Pi, lihat [Raspberry Pi](/id/install/raspberry-pi).

### Checklist tuning systemd (opsional)

Untuk host VM yang menggunakan `systemd`, pertimbangkan:

- Tambahkan env layanan untuk jalur startup yang stabil:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Buat perilaku restart eksplisit:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Utamakan disk berbasis SSD untuk jalur state/cache guna mengurangi penalti cold start I/O acak.

Untuk jalur standar `openclaw onboard --install-daemon`, edit unit pengguna:

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

Jika Anda sengaja memasang unit sistem, edit
`openclaw-gateway.service` melalui `sudo systemctl edit openclaw-gateway.service`.

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd dapat mengotomatiskan pemulihan layanan](https://www.redhat.com/en/blog/systemd-automate-recovery).

Untuk perilaku OOM Linux, pemilihan korban proses anak, dan diagnostik `exit 137`,
lihat [Tekanan memori Linux dan OOM kill](/id/platforms/linux#memory-pressure-and-oom-kills).

## Terkait

- [Ringkasan pemasangan](/id/install)
- [DigitalOcean](/id/install/digitalocean)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
