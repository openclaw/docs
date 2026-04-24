---
read_when:
    - Anda ingin menjalankan Gateway di server Linux atau cloud VPS
    - Anda memerlukan peta singkat panduan hosting
    - Anda menginginkan tuning server Linux umum untuk OpenClaw
sidebarTitle: Linux Server
summary: Jalankan OpenClaw di server Linux atau cloud VPS — pemilih provider, arsitektur, dan tuning
title: Server Linux
x-i18n:
    generated_at: "2026-04-24T09:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Jalankan Gateway OpenClaw di server Linux atau cloud VPS mana pun. Halaman ini membantu Anda
memilih provider, menjelaskan cara kerja deployment cloud, dan membahas tuning Linux umum
yang berlaku di mana saja.

## Pilih provider

<CardGroup cols={2}>
  <Card title="Railway" href="/id/install/railway">Setup sekali klik, melalui browser</Card>
  <Card title="Northflank" href="/id/install/northflank">Setup sekali klik, melalui browser</Card>
  <Card title="DigitalOcean" href="/id/install/digitalocean">VPS berbayar yang sederhana</Card>
  <Card title="Oracle Cloud" href="/id/install/oracle">Tier ARM Always Free</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Docker di VPS Hetzner</Card>
  <Card title="Hostinger" href="/id/install/hostinger">VPS dengan setup sekali klik</Card>
  <Card title="GCP" href="/id/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/id/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/id/install/exe-dev">VM dengan proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/id/install/raspberry-pi">Self-hosted ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** juga bekerja dengan baik.
Panduan video dari komunitas tersedia di
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(sumber daya komunitas -- mungkin menjadi tidak tersedia).

## Cara kerja setup cloud

- **Gateway berjalan di VPS** dan memiliki state + workspace.
- Anda terhubung dari laptop atau ponsel melalui **UI Control** atau **Tailscale/SSH**.
- Perlakukan VPS sebagai sumber kebenaran dan **cadangkan** state + workspace secara rutin.
- Default yang aman: pertahankan Gateway di loopback dan akses melalui tunnel SSH atau Tailscale Serve.
  Jika Anda bind ke `lan` atau `tailnet`, wajibkan `gateway.auth.token` atau `gateway.auth.password`.

Halaman terkait: [Gateway remote access](/id/gateway/remote), [Platforms hub](/id/platforms).

## Agen perusahaan bersama di VPS

Menjalankan satu agen untuk satu tim adalah setup yang valid ketika setiap pengguna berada dalam batas kepercayaan yang sama dan agen tersebut hanya untuk bisnis.

- Simpan di runtime khusus (VPS/VM/container + pengguna OS/akun khusus).
- Jangan login-kan runtime tersebut ke akun Apple/Google pribadi atau profil browser/password-manager pribadi.
- Jika pengguna saling adversarial, pisahkan berdasarkan gateway/host/pengguna OS.

Detail model keamanan: [Security](/id/gateway/security).

## Menggunakan Node dengan VPS

Anda dapat mempertahankan Gateway di cloud dan memasangkan **Node** di perangkat lokal Anda
(Mac/iOS/Android/headless). Node menyediakan kemampuan screen/camera/canvas lokal dan `system.run`
sementara Gateway tetap berada di cloud.

Dokumentasi: [Nodes](/id/nodes), [Nodes CLI](/id/cli/nodes).

## Tuning startup untuk VM kecil dan host ARM

Jika perintah CLI terasa lambat pada VM berdaya rendah (atau host ARM), aktifkan module compile cache Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` meningkatkan waktu startup perintah yang berulang.
- `OPENCLAW_NO_RESPAWN=1` menghindari overhead startup tambahan dari jalur self-respawn.
- Run perintah pertama menghangatkan cache; run berikutnya lebih cepat.
- Untuk hal khusus Raspberry Pi, lihat [Raspberry Pi](/id/install/raspberry-pi).

### Checklist tuning systemd (opsional)

Untuk host VM yang menggunakan `systemd`, pertimbangkan:

- Tambahkan env service untuk jalur startup yang stabil:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Pertahankan perilaku restart tetap eksplisit:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Pilih disk berbasis SSD untuk path state/cache guna mengurangi penalti cold-start random-I/O.

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

Jika Anda sengaja menginstal unit sistem, edit
`openclaw-gateway.service` melalui `sudo systemctl edit openclaw-gateway.service`.

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Untuk perilaku Linux OOM, pemilihan korban child process, dan diagnostik
`exit 137`, lihat [Linux memory pressure and OOM kills](/id/platforms/linux#memory-pressure-and-oom-kills).

## Terkait

- [Install overview](/id/install)
- [DigitalOcean](/id/install/digitalocean)
- [Fly.io](/id/install/fly)
- [Hetzner](/id/install/hetzner)
