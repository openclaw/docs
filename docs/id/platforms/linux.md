---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug OOM kill Linux atau exit 137 di VPS atau container
summary: Dukungan Linux + status aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-04-24T09:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway didukung sepenuhnya di Linux. **Node adalah runtime yang direkomendasikan**.
Bun tidak direkomendasikan untuk Gateway (ada bug WhatsApp/Telegram).

Aplikasi pendamping Linux native sedang direncanakan. Kontribusi dipersilakan jika Anda ingin membantu membangunnya.

## Jalur cepat untuk pemula (VPS)

1. Instal Node 24 (direkomendasikan; Node 22 LTS, saat ini `22.14+`, masih berfungsi untuk kompatibilitas)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan lakukan autentikasi dengan shared secret yang dikonfigurasi (token secara default; password jika Anda mengatur `gateway.auth.mode: "password"`)

Panduan server Linux lengkap: [Linux Server](/id/vps). Contoh VPS langkah demi langkah: [exe.dev](/id/install/exe-dev)

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

Pilih **Gateway service** saat diminta.

Perbaikan/migrasi:

```
openclaw doctor
```

## Kontrol sistem (unit pengguna systemd)

Secara default, OpenClaw menginstal layanan **pengguna** systemd. Gunakan layanan **sistem**
untuk server bersama atau yang selalu aktif. `openclaw gateway install` dan
`openclaw onboard --install-daemon` sudah merender unit kanonis saat ini
untuk Anda; tulis sendiri hanya jika Anda memerlukan penyiapan manajer layanan/sistem
yang kustom. Panduan layanan lengkap ada di [Runbook Gateway](/id/gateway).

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
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktifkan:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan OOM kill

Di Linux, kernel memilih korban OOM saat cgroup host, VM, atau container
kehabisan memori. Gateway bisa menjadi korban yang buruk karena memiliki sesi
jangka panjang dan koneksi channel. Karena itu OpenClaw memihak proses anak yang bersifat sementara
agar dibunuh sebelum Gateway jika memungkinkan.

Untuk spawn child Linux yang memenuhi syarat, OpenClaw memulai child melalui
wrapper `/bin/sh` singkat yang menaikkan `oom_score_adj` child sendiri ke `1000`, lalu
menjalankan `exec` ke perintah sebenarnya. Ini adalah operasi tanpa hak istimewa karena child
hanya meningkatkan kemungkinan dirinya sendiri dibunuh oleh OOM.

Surface proses anak yang tercakup meliputi:

- child perintah yang dikelola supervisor,
- child shell PTY,
- child server MCP stdio,
- proses browser/Chrome yang dijalankan oleh OpenClaw.

Wrapper ini hanya untuk Linux dan dilewati jika `/bin/sh` tidak tersedia. Wrapper juga
dilewati jika env child mengatur `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, atau `off`.

Untuk memverifikasi proses anak:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk child yang tercakup adalah `1000`. Proses Gateway harus tetap
mempertahankan nilainya yang normal, biasanya `0`.

Ini bukan pengganti penyetelan memori biasa. Jika VPS atau container berulang kali
membunuh child, tingkatkan batas memori, kurangi konkurensi, atau tambahkan kontrol sumber daya
yang lebih kuat seperti systemd `MemoryMax=` atau batas memori tingkat container.

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Linux Server](/id/vps)
- [Raspberry Pi](/id/install/raspberry-pi)
