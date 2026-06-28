---
read_when:
    - Mengemas OpenClaw.app
    - Men-debug layanan launchd Gateway macOS
    - Menginstal CLI Gateway untuk macOS
summary: Runtime Gateway di macOS (layanan launchd eksternal)
title: Gateway di macOS
x-i18n:
    generated_at: "2026-06-28T00:12:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app tidak lagi membundel Node/Bun atau runtime Gateway. Aplikasi macOS
mengharapkan instalasi CLI `openclaw` **eksternal**, tidak menjalankan Gateway sebagai
proses anak, dan mengelola layanan launchd per pengguna agar Gateway tetap
berjalan (atau terhubung ke Gateway lokal yang sudah ada jika sudah berjalan).

## Instal CLI (wajib untuk mode lokal)

Node 24 adalah runtime bawaan di Mac. Node 22 LTS, saat ini `22.19+`, masih berfungsi untuk kompatibilitas. Lalu instal `openclaw` secara global:

```bash
npm install -g openclaw@<version>
```

Tombol **Instal CLI** di aplikasi macOS menjalankan alur instalasi global yang sama dengan yang
digunakan aplikasi secara internal: alur ini mengutamakan npm terlebih dahulu, lalu pnpm, lalu bun jika itu satu-satunya
manajer paket yang terdeteksi. Node tetap menjadi runtime Gateway yang direkomendasikan.

## Launchd (Gateway sebagai LaunchAgent)

Label:

- `ai.openclaw.gateway` (atau `ai.openclaw.<profile>`; `com.openclaw.*` lama mungkin tetap ada)

Lokasi plist (per pengguna):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (atau `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Manajer:

- Aplikasi macOS memiliki instalasi/pembaruan LaunchAgent dalam mode Lokal.
- CLI juga dapat menginstalnya: `openclaw gateway install`.

Perilaku:

- "OpenClaw Aktif" mengaktifkan/menonaktifkan LaunchAgent.
- Keluar dari aplikasi **tidak** menghentikan gateway (launchd membuatnya tetap hidup).
- Jika Gateway sudah berjalan pada port yang dikonfigurasi, aplikasi terhubung ke
  Gateway tersebut alih-alih memulai yang baru.

Pencatatan log:

- stdout launchd: `~/Library/Logs/openclaw/gateway.log` (profil menggunakan `gateway-<profile>.log`)
- stderr launchd: ditekan

## Kompatibilitas versi

Aplikasi macOS memeriksa versi gateway terhadap versinya sendiri. Jika keduanya
tidak kompatibel, perbarui CLI global agar sesuai dengan versi aplikasi.

## Direktori state di macOS

Simpan state OpenClaw pada disk lokal yang tidak disinkronkan. Hindari iCloud Drive dan folder lain
yang disinkronkan cloud karena latensi sinkronisasi dan kunci file dapat memengaruhi sesi,
kredensial, dan state Gateway.

Tetapkan `OPENCLAW_STATE_DIR` ke jalur lokal hanya saat Anda membutuhkan override.
`openclaw doctor` memperingatkan tentang jalur state umum yang disinkronkan cloud dan merekomendasikan
untuk kembali ke penyimpanan lokal. Lihat
[variabel lingkungan](/id/help/environment#path-related-env-vars) dan
[Doctor](/id/gateway/doctor).

## Debug konektivitas aplikasi

Gunakan CLI debug macOS dari checkout sumber untuk menjalankan handshake WebSocket Gateway
dan logika penemuan yang sama dengan yang digunakan aplikasi:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` menerima `--url`, `--token`, `--timeout`, dan `--json`. `discover`
menerima `--timeout`, `--json`, dan `--include-local`. Bandingkan keluaran penemuan
dengan `openclaw gateway discover --json` saat Anda perlu memisahkan penemuan CLI
dari masalah koneksi sisi aplikasi.

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
