---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug penghentian OOM Linux atau exit 137 pada VPS atau kontainer
summary: Dukungan Linux + status aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-06-27T17:42:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway didukung sepenuhnya di Linux. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (bug WhatsApp/Telegram).

Aplikasi pendamping Linux native sedang direncanakan. Kontribusi dipersilakan jika Anda ingin membantu membuatnya.

## Jalur cepat pemula (VPS)

1. Instal Node 24 (direkomendasikan; Node 22 LTS, saat ini `22.19+`, masih berfungsi untuk kompatibilitas)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan lakukan autentikasi dengan rahasia bersama yang dikonfigurasi (token secara default; kata sandi jika Anda menetapkan `gateway.auth.mode: "password"`)

Panduan server Linux lengkap: [Server Linux](/id/vps). Contoh VPS langkah demi langkah: [exe.dev](/id/install/exe-dev)

## Instal

- [Memulai](/id/start/getting-started)
- [Instal & pembaruan](/id/install/updating)
- Alur opsional: [Bun (eksperimental)](/id/install/bun), [Nix](/id/install/nix), [Docker](/id/install/docker)

## Gateway

- [Runbook Gateway](/id/gateway)
- [Konfigurasi](/id/gateway/configuration)

## Instal layanan Gateway (CLI)

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

OpenClaw menginstal layanan **pengguna** systemd secara default. Gunakan layanan
**sistem** untuk server bersama atau yang selalu aktif. `openclaw gateway install` dan
`openclaw onboard --install-daemon` sudah merender unit kanonis saat ini
untuk Anda; tulis sendiri hanya ketika Anda memerlukan penyiapan sistem/manajer layanan
khusus. Panduan layanan lengkap tersedia di [Runbook Gateway](/id/gateway).

Penyiapan minimal:

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
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktifkan:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan penghentian OOM

Di Linux, kernel memilih korban OOM ketika cgroup host, VM, atau kontainer
kehabisan memori. Gateway bisa menjadi korban yang buruk karena memiliki
sesi berumur panjang dan koneksi kanal. Karena itu, OpenClaw mengarahkan proses
anak sementara agar dihentikan sebelum Gateway jika memungkinkan.

Untuk proses anak Linux yang memenuhi syarat, OpenClaw memulai anak melalui wrapper
`/bin/sh` singkat yang menaikkan `oom_score_adj` milik anak itu sendiri ke `1000`, lalu
melakukan `exec` pada perintah sebenarnya. Ini adalah operasi tanpa hak istimewa karena anak
hanya meningkatkan kemungkinan penghentian OOM untuk dirinya sendiri.

Permukaan proses anak yang tercakup meliputi:

- anak perintah yang dikelola supervisor,
- anak shell PTY,
- anak server stdio MCP,
- proses browser/Chrome yang diluncurkan OpenClaw.

Wrapper ini khusus Linux dan dilewati ketika `/bin/sh` tidak tersedia. Wrapper ini
juga dilewati jika env anak menetapkan `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, atau `off`.

Untuk memverifikasi proses anak:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk anak yang tercakup adalah `1000`. Proses Gateway harus mempertahankan
skor normalnya, biasanya `0`.

Unit systemd yang direkomendasikan juga menetapkan `OOMPolicy=continue`. Ini menjaga
unit Gateway tetap hidup ketika proses anak sementara dipilih oleh OOM killer;
perintah/sesi anak dapat gagal dan melaporkan kesalahannya tanpa systemd menandai
seluruh layanan gateway gagal dan memulai ulang semua kanal.

Ini tidak menggantikan penyetelan memori normal. Jika VPS atau kontainer berulang kali
menghentikan anak, tingkatkan batas memori, kurangi konkurensi, atau tambahkan
kontrol sumber daya yang lebih kuat seperti `MemoryMax=` systemd atau batas memori tingkat kontainer.

## Terkait

- [Ringkasan instalasi](/id/install)
- [Server Linux](/id/vps)
- [Raspberry Pi](/id/install/raspberry-pi)
