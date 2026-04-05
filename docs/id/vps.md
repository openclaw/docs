---
read_when:
    - Anda ingin menjalankan Gateway di server Linux atau cloud VPS
    - Anda memerlukan peta singkat panduan hosting
    - Anda menginginkan penyesuaian server Linux generik untuk OpenClaw
sidebarTitle: Linux Server
summary: Jalankan OpenClaw di server Linux atau cloud VPS — pemilih penyedia, arsitektur, dan penyesuaian
title: Server Linux
x-i18n:
    generated_at: "2026-04-05T14:10:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Server Linux

Jalankan Gateway OpenClaw di server Linux atau cloud VPS mana pun. Halaman ini membantu Anda
memilih penyedia, menjelaskan cara kerja deployment cloud, dan membahas penyesuaian Linux generik
yang berlaku di mana saja.

## Pilih penyedia

<CardGroup cols={2}>
  <Card title="Railway" href="/id/install/railway">Penyiapan satu klik, di browser</Card>
  <Card title="Northflank" href="/id/install/northflank">Penyiapan satu klik, di browser</Card>
  <Card title="DigitalOcean" href="/id/install/digitalocean">VPS berbayar sederhana</Card>
  <Card title="Oracle Cloud" href="/id/install/oracle">Tier ARM Always Free</Card>
  <Card title="Fly.io" href="/id/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/id/install/hetzner">Docker di VPS Hetzner</Card>
  <Card title="GCP" href="/id/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/id/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/id/install/exe-dev">VM dengan proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/id/install/raspberry-pi">ARM self-hosted</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** juga bekerja dengan baik.
Video panduan komunitas tersedia di
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(sumber daya komunitas -- mungkin menjadi tidak tersedia).

## Cara kerja penyiapan cloud

- **Gateway berjalan di VPS** dan memiliki state + workspace.
- Anda terhubung dari laptop atau ponsel melalui **Control UI** atau **Tailscale/SSH**.
- Perlakukan VPS sebagai sumber kebenaran dan lakukan **backup** state + workspace secara rutin.
- Default yang aman: pertahankan Gateway di loopback dan akses melalui tunnel SSH atau Tailscale Serve.
  Jika Anda bind ke `lan` atau `tailnet`, wajibkan `gateway.auth.token` atau `gateway.auth.password`.

Halaman terkait: [Akses jarak jauh Gateway](/id/gateway/remote), [Hub platform](/id/platforms).

## Agent perusahaan bersama di VPS

Menjalankan satu agent untuk satu tim adalah penyiapan yang valid saat setiap pengguna berada dalam batas kepercayaan yang sama dan agent hanya digunakan untuk bisnis.

- Simpan di runtime khusus (VPS/VM/container + pengguna OS/akun khusus).
- Jangan login ke runtime tersebut dengan akun Apple/Google pribadi atau profil browser/pengelola kata sandi pribadi.
- Jika pengguna saling adversarial, pisahkan berdasarkan gateway/host/pengguna OS.

Detail model keamanan: [Keamanan](/id/gateway/security).

## Menggunakan node dengan VPS

Anda dapat mempertahankan Gateway di cloud dan memasangkan **node** pada perangkat lokal Anda
(Mac/iOS/Android/headless). Node menyediakan kemampuan layar/kamera/canvas lokal dan `system.run`
sementara Gateway tetap berada di cloud.

Dokumentasi: [Node](/id/nodes), [Nodes CLI](/cli/nodes).

## Penyesuaian startup untuk VM kecil dan host ARM

Jika perintah CLI terasa lambat pada VM berdaya rendah (atau host ARM), aktifkan cache kompilasi modul Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` meningkatkan waktu startup perintah berulang.
- `OPENCLAW_NO_RESPAWN=1` menghindari overhead startup tambahan dari jalur self-respawn.
- Eksekusi perintah pertama menghangatkan cache; eksekusi berikutnya lebih cepat.
- Untuk detail khusus Raspberry Pi, lihat [Raspberry Pi](/id/install/raspberry-pi).

### Checklist penyesuaian systemd (opsional)

Untuk host VM yang menggunakan `systemd`, pertimbangkan:

- Tambahkan env layanan untuk jalur startup yang stabil:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Pertahankan perilaku restart yang eksplisit:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Utamakan disk berbasis SSD untuk path state/cache guna mengurangi penalti cold-start random-I/O.

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

Jika Anda sengaja memasang unit sistem sebagai gantinya, edit
`openclaw-gateway.service` melalui `sudo systemctl edit openclaw-gateway.service`.

Cara kebijakan `Restart=` membantu pemulihan otomatis:
[systemd dapat mengotomatiskan pemulihan layanan](https://www.redhat.com/en/blog/systemd-automate-recovery).
