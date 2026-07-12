---
read_when:
    - Mencari status aplikasi pendamping Linux
    - Merencanakan cakupan platform atau kontribusi
    - Men-debug penghentian akibat OOM Linux atau kode keluar 137 pada VPS atau kontainer
summary: Status dukungan Linux + aplikasi pendamping
title: Aplikasi Linux
x-i18n:
    generated_at: "2026-07-12T14:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway didukung sepenuhnya di Linux. Node adalah runtime yang direkomendasikan; Bun
tidak direkomendasikan (terdapat masalah WhatsApp/Telegram yang diketahui).

Belum ada aplikasi pendamping Linux native. Kontribusi dipersilakan.

## Jalur cepat (VPS)

1. Instal Node 24 (direkomendasikan) atau Node 22.19+ (LTS, masih didukung).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Dari laptop Anda: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Buka `http://127.0.0.1:18789/` dan lakukan autentikasi dengan rahasia bersama yang
   telah dikonfigurasi (secara default berupa token; kata sandi jika `gateway.auth.mode` adalah `"password"`).

Panduan server lengkap: [Server Linux](/id/vps). Contoh VPS langkah demi langkah:
[exe.dev](/id/install/exe-dev).

## Instalasi

- [Memulai](/id/start/getting-started)
- [Instalasi & pembaruan](/id/install/updating)
- Opsional: [Bun (eksperimental)](/id/install/bun), [Nix](/id/install/nix), [Docker](/id/install/docker)

## Layanan Gateway (systemd)

Instal dengan salah satu perintah berikut:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # pilih "Layanan Gateway" saat diminta
```

Perbaiki atau migrasikan instalasi yang sudah ada:

```bash
openclaw doctor
```

`openclaw gateway install` secara default menghasilkan unit **pengguna** systemd. Panduan
layanan lengkap, termasuk varian unit tingkat **sistem** untuk host bersama atau
yang selalu aktif, tersedia di [panduan operasional Gateway](/id/gateway#supervision-and-service-lifecycle).

Tulis unit secara manual hanya untuk penyiapan khusus. Contoh unit pengguna minimal
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Aktifkan unit tersebut:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Tekanan memori dan penghentian OOM

Di Linux, kernel memilih proses korban OOM ketika cgroup host, VM, atau kontainer
kehabisan memori. Gateway bukan korban yang tepat karena mengelola sesi
berumur panjang dan koneksi saluran, sehingga OpenClaw mengupayakan agar proses
anak sementara dihentikan terlebih dahulu jika memungkinkan.

Untuk proses anak Linux yang memenuhi syarat, OpenClaw membungkus perintah dengan shim
`/bin/sh` singkat yang menaikkan `oom_score_adj` milik proses anak tersebut menjadi `1000`, lalu
menjalankan perintah sebenarnya dengan `exec`. Tindakan ini tidak memerlukan hak istimewa: sebuah proses selalu
dapat menaikkan skor OOM miliknya sendiri.

Cakupan proses anak:

- Proses anak perintah yang dikelola supervisor
- Proses anak shell PTY
- Proses anak server stdio MCP
- Proses peramban/Chrome yang diluncurkan OpenClaw (melalui runtime proses SDK plugin)

Pembungkus ini hanya digunakan di Linux dan dilewati ketika `/bin/sh` tidak tersedia, atau ketika
lingkungan proses anak menetapkan `OPENCLAW_CHILD_OOM_SCORE_ADJ` ke `0`, `false`, `no`, atau
`off`.

Verifikasi proses anak:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Nilai yang diharapkan untuk proses anak yang tercakup adalah `1000`; proses Gateway itu sendiri
mempertahankan skor normalnya (biasanya `0`).

`OOMPolicy=continue` pada unit systemd menjaga layanan Gateway tetap berjalan ketika
proses anak sementara dipilih oleh penghenti OOM, alih-alih menandai seluruh
unit sebagai gagal dan memulai ulang semua saluran; proses anak/sesi yang gagal melaporkan
kesalahannya sendiri.

Hal ini tidak menggantikan penyesuaian memori yang semestinya. Jika VPS atau kontainer berulang kali
menghentikan proses anak, naikkan batas memori, kurangi konkurensi, atau tambahkan
kontrol sumber daya yang lebih ketat (`MemoryMax=` systemd, batas memori kontainer).

## Terkait

- [Ringkasan instalasi](/id/install)
- [Server Linux](/id/vps)
- [Raspberry Pi](/id/install/raspberry-pi)
- [Panduan operasional Gateway](/id/gateway)
- [Konfigurasi Gateway](/id/gateway/configuration)
