---
read_when:
    - Mengemas OpenClaw.app
    - Men-debug layanan launchd Gateway macOS
    - Menginstal CLI Gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-07-16T18:17:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app tidak menyertakan Node atau runtime Gateway. Aplikasi macOS
mengharapkan penginstalan CLI **eksternal** `openclaw`, tidak menjalankan Gateway sebagai
proses anak, dan mengelola layanan launchd per pengguna agar Gateway tetap
berjalan (atau terhubung ke Gateway lokal yang sudah berjalan).

## Penyiapan otomatis

Pada Mac baru, pilih **This Mac** saat orientasi awal. Aplikasi menjalankan
skrip penginstal bertanda tangan yang disertakan sebelum wizard Gateway: skrip tersebut menginstal
runtime Node di ruang pengguna dan CLI `openclaw` yang sesuai di bawah `~/.openclaw`,
lalu menginstal dan memulai layanan launchd per pengguna. Jalur ini tidak memerlukan
Terminal, Homebrew, atau akses administrator.

Aplikasi hanya menyertakan skrip penginstal, bukan payload Node atau Gateway;
penyiapan memerlukan koneksi internet untuk mengunduh runtime dan paket
OpenClaw yang sesuai.

## Pemulihan manual

Node 24.15+ direkomendasikan untuk penginstalan manual; Node 22.22.3+ juga berfungsi. Instal
`openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Gunakan **Retry setup** setelah penyiapan otomatis gagal. Jika masih gagal,
instal CLI secara manual dengan perintah di atas, lalu pilih **Check again**
dalam orientasi awal.

## Launchd (Gateway sebagai LaunchAgent)

Label: `ai.openclaw.gateway` (profil default), atau `ai.openclaw.<profile>`
untuk profil bernama.

Lokasi plist (per pengguna): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(atau `ai.openclaw.<profile>.plist`).

Aplikasi macOS mengelola penginstalan/pembaruan LaunchAgent untuk profil default dalam
mode Lokal. CLI juga dapat menginstalnya secara langsung: `openclaw gateway install`
(profil bernama dipilih melalui variabel lingkungan `OPENCLAW_PROFILE`).

Perilaku:

- "OpenClaw Active" mengaktifkan/menonaktifkan LaunchAgent.
- Menutup aplikasi **tidak** menghentikan Gateway (launchd membuatnya tetap berjalan).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi terhubung ke
  Gateway tersebut alih-alih memulai yang baru.

Pencatatan log:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan
  `gateway-<profile>.log`)
- stderr launchd: dibisukan
- Jika host mengalami perulangan dengan `EADDRINUSE` berulang atau mulai ulang cepat, periksa
  LaunchAgent `ai.openclaw.gateway` / `ai.openclaw.node` yang duplikat dan solusi sementara
  penanda launchd dalam
  [pemecahan masalah Gateway](/id/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Kompatibilitas versi

Aplikasi macOS memeriksa versi Gateway terhadap versinya sendiri. Orientasi awal
secara otomatis menjalankan penyiapan terkelola ketika CLI yang ada tidak ditemukan atau
tidak kompatibel. Gunakan **Retry setup** untuk mengulangi penginstalan, atau **Check again**
setelah memperbaiki CLI eksternal.

## Direktori status di macOS

Simpan status OpenClaw pada disk lokal yang tidak disinkronkan. Hindari iCloud Drive dan folder lain
yang disinkronkan dengan cloud; latensi sinkronisasi dan penguncian file dapat memengaruhi sesi,
kredensial, dan status Gateway.

Tetapkan `OPENCLAW_STATE_DIR` ke jalur lokal hanya ketika Anda memerlukan penggantian.
`openclaw doctor` memperingatkan tentang jalur status umum yang disinkronkan dengan cloud dan merekomendasikan
pemindahan kembali ke penyimpanan lokal. Lihat
[variabel lingkungan](/id/help/environment#path-related-env-vars) dan
[Doctor](/id/gateway/doctor).

## Men-debug konektivitas aplikasi

Gunakan CLI debug macOS dari checkout sumber untuk menjalankan handshake WebSocket Gateway
dan logika penemuan yang sama dengan yang digunakan aplikasi:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` menerima `--url`, `--token`, `--timeout`, `--probe`, dan `--json`
(serta penggantian identitas klien; jalankan dengan `--help` untuk daftar lengkap).
`discover` menerima `--timeout`, `--json`, dan `--include-local`. Bandingkan
keluaran penemuan dengan `openclaw gateway discover --json` ketika Anda perlu
membedakan penemuan CLI dari masalah koneksi pada sisi aplikasi.

## Pemeriksaan cepat

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Kemudian:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [panduan operasional Gateway](/id/gateway)
