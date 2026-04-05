---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
summary: Dukungan Linux + status aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-04-05T14:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Aplikasi Linux

Gateway didukung sepenuhnya di Linux. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (bug WhatsApp/Telegram).

Aplikasi pendamping Linux native sedang direncanakan. Kontribusi diterima jika Anda ingin membantu membangunnya.

## Jalur cepat untuk pemula (VPS)

1. Instal Node 24 (direkomendasikan; Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan lakukan autentikasi dengan shared secret yang dikonfigurasi (token secara default; kata sandi jika Anda menetapkan `gateway.auth.mode: "password"`)

Panduan lengkap server Linux: [Server Linux](/vps). Contoh VPS langkah demi langkah: [exe.dev](/install/exe-dev)

## Instalasi

- [Memulai](/start/getting-started)
- [Instalasi & pembaruan](/install/updating)
- Alur opsional: [Bun (eksperimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

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

OpenClaw secara default menginstal layanan **pengguna** systemd. Gunakan layanan **sistem**
untuk server bersama atau yang selalu aktif. `openclaw gateway install` dan
`openclaw onboard --install-daemon` sudah merender unit kanonis saat ini
untuk Anda; tulis sendiri hanya saat Anda memerlukan
setup sistem/service-manager kustom. Panduan layanan lengkap ada di [runbook Gateway](/id/gateway).

Setup minimal:

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
