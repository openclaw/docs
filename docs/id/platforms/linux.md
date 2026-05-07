---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug penghentian akibat OOM di Linux atau kode keluar 137 pada VPS atau kontainer
summary: Dukungan Linux + status aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-05-07T13:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway didukung sepenuhnya di Linux. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (bug WhatsApp/Telegram).

Aplikasi pendamping Linux native direncanakan. Kontribusi dipersilakan jika Anda ingin membantu membuatnya.

## Jalur cepat pemula (VPS)

1. Instal Node 24 (direkomendasikan; Node 22 LTS, saat ini `22.16+`, masih berfungsi untuk kompatibilitas)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan autentikasi dengan rahasia bersama yang dikonfigurasi (token secara default; kata sandi jika Anda menetapkan `gateway.auth.mode: "password"`)

Panduan server Linux lengkap: [Server Linux](/id/vps). Contoh VPS langkah demi langkah: [exe.dev](/id/install/exe-dev)

## Instalasi

- [Memulai](/id/start/getting-started)
- [Instalasi & pembaruan](/id/install/updating)
- Alur opsional: [Bun (eksperimental)](/id/install/bun), [Nix](/id/install/nix), [Docker](/id/install/docker)

## Gateway

- [Runbook Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instalasi layanan Gateway (CLI)

Gunakan salah satu dari ini:

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

## Kontrol sistem (unit pengguna systemd)

OpenClaw menginstal layanan **pengguna** systemd secara default. Gunakan layanan **sistem**
untuk server bersama atau yang selalu aktif. `openclaw gateway install` dan
`openclaw onboard --install-daemon` sudah merender unit kanonis saat ini
untuk Anda; tulis secara manual hanya saat Anda membutuhkan pengaturan sistem/manajer-layanan
khusus. Panduan layanan lengkap tersedia di [runbook Gateway](/id/gateway).

Pengaturan minimal:

Buat `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktifkan:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan penghentian OOM

Di Linux, kernel memilih korban OOM saat cgroup host, VM, atau kontainer
kehabisan memori. Gateway bisa menjadi korban yang buruk karena memiliki sesi
berumur panjang dan koneksi kanal. Karena itu OpenClaw mengarahkan proses anak
sementara agar dihentikan sebelum Gateway jika memungkinkan.

Untuk spawn proses anak Linux yang memenuhi syarat, OpenClaw memulai anak melalui wrapper
`/bin/sh` singkat yang menaikkan `oom_score_adj` milik anak menjadi `1000`, lalu
menjalankan perintah sebenarnya dengan `exec`. Ini adalah operasi tanpa hak istimewa karena anak
hanya meningkatkan kemungkinan penghentian OOM untuk dirinya sendiri.

Permukaan proses anak yang tercakup meliputi:

- proses anak perintah yang dikelola supervisor,
- proses anak shell PTY,
- proses anak server stdio MCP,
- proses browser/Chrome yang diluncurkan OpenClaw.

Wrapper hanya untuk Linux dan dilewati saat `/bin/sh` tidak tersedia. Ini
juga dilewati jika env anak menetapkan `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, atau `off`.

Untuk memverifikasi proses anak:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk anak yang tercakup adalah `1000`. Proses Gateway harus mempertahankan
skor normalnya, biasanya `0`.

Ini tidak menggantikan penyesuaian memori normal. Jika VPS atau kontainer berulang kali
menghentikan anak, tingkatkan batas memori, kurangi konkurensi, atau tambahkan kontrol
sumber daya yang lebih kuat seperti `MemoryMax=` systemd atau batas memori tingkat kontainer.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Server Linux](/id/vps)
- [Raspberry Pi](/id/install/raspberry-pi)
