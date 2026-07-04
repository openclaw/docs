---
read_when:
    - Mengemas OpenClaw.app
    - Men-debug layanan launchd Gateway macOS
    - Menginstal CLI Gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-07-04T06:52:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway
sebagai proses anak, dan mengelola layanan launchd per pengguna agar Gateway
tetap berjalan (atau terhubung ke Gateway lokal yang sudah ada jika sudah
berjalan).

## Penyiapan otomatis

Pada Mac baru, pilih **Mac Ini** selama onboarding. Aplikasi menjalankan installer
bertanda tangan yang dibundel sebelum wizard Gateway, memasang runtime Node
ruang pengguna dan CLI `openclaw` yang cocok di bawah `~/.openclaw`, lalu
memasang dan memulai layanan launchd per pengguna. Jalur ini tidak memerlukan
Terminal, Homebrew, atau akses administrator.

Aplikasi membundel skrip installer, bukan payload Node atau Gateway. Karena itu,
penyiapan memerlukan koneksi internet untuk mengunduh runtime dan paket
OpenClaw yang cocok.

## Pemulihan manual

Node 24 direkomendasikan untuk instalasi manual. Node 22 LTS, saat ini `22.19+`,
juga berfungsi. Lalu pasang `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Gunakan **Coba lagi penyiapan** setelah penyiapan otomatis gagal. Jika masih
gagal, pasang CLI secara manual dengan perintah di atas, lalu pilih **Periksa
lagi** di onboarding. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin tetap ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Pengelola:

- Aplikasi macOS memiliki pemasangan/pembaruan LaunchAgent dalam mode Lokal.
- CLI juga dapat memasangnya: `openclaw gateway install`.

Perilaku:

- "OpenClaw Aktif" mengaktifkan/menonaktifkan LaunchAgent.
- Keluar dari aplikasi **tidak** menghentikan gateway (launchd menjaganya tetap hidup).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi terhubung
  ke sana alih-alih memulai yang baru.

Logging:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan `gateway-<profile>.log`)
- stderr launchd: disembunyikan

## Kompatibilitas versi

Aplikasi macOS memeriksa versi Gateway terhadap versinya sendiri. Onboarding
secara otomatis menjalankan penyiapan terkelola ketika CLI yang ada tidak ada
atau tidak kompatibel. Gunakan **Coba lagi penyiapan** untuk mengulang instalasi
atau **Periksa lagi** setelah memperbaiki CLI eksternal.

## Direktori status di macOS

Simpan status OpenClaw pada disk lokal yang tidak disinkronkan. Hindari iCloud
Drive dan folder lain yang disinkronkan ke cloud karena latensi sinkronisasi dan
kunci file dapat memengaruhi sesi, kredensial, dan status Gateway.

Tetapkan `OPENCLAW_STATE_DIR` ke path lokal hanya ketika Anda memerlukan
override. `openclaw doctor` memperingatkan tentang path status umum yang
disinkronkan ke cloud dan merekomendasikan pemindahan kembali ke penyimpanan
lokal. Lihat
[variabel lingkungan](/id/help/environment#path-related-env-vars) dan
[Doctor](/id/gateway/doctor).

## Debug konektivitas aplikasi

Gunakan CLI debug macOS dari checkout sumber untuk menjalankan handshake
WebSocket Gateway dan logika penemuan yang sama dengan yang digunakan aplikasi:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` menerima `--url`, `--token`, `--timeout`, dan `--json`. `discover`
menerima `--timeout`, `--json`, dan `--include-local`. Bandingkan output
penemuan dengan `openclaw gateway discover --json` ketika Anda perlu memisahkan
penemuan CLI dari masalah koneksi sisi aplikasi.

## Pemeriksaan smoke

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Lalu:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Terkait

- [aplikasi macOS](/id/platforms/macos)
- [Runbook Gateway](/id/gateway)
