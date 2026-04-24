---
read_when:
    - Mengimplementasikan fitur aplikasi macOS
    - Mengubah siklus hidup Gateway atau bridge node di macOS
summary: Aplikasi pendamping macOS OpenClaw (bilah menu + broker Gateway)
title: Aplikasi macOS
x-i18n:
    generated_at: "2026-04-24T09:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c7911d0a2e7be7fa437c5ef01a98c0f7da5e44388152ba182581cd2e381ba8b
    source_path: platforms/macos.md
    workflow: 15
---

Aplikasi macOS adalah **pendamping bilah menu** untuk OpenClaw. Aplikasi ini memiliki izin,
mengelola/melampirkan ke Gateway secara lokal (launchd atau manual), dan mengekspos
kapabilitas macOS ke agen sebagai node.

## Apa yang dilakukannya

- Menampilkan notifikasi native dan status di bilah menu.
- Memiliki prompt TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Menjalankan atau terhubung ke Gateway (lokal atau remote).
- Mengekspos tool khusus macOS (Canvas, Camera, Screen Recording, `system.run`).
- Memulai layanan host node lokal dalam mode **remote** (launchd), dan menghentikannya dalam mode **local**.
- Secara opsional meng-host **PeekabooBridge** untuk otomatisasi UI.
- Menginstal CLI global (`openclaw`) atas permintaan melalui npm, pnpm, atau bun (aplikasi lebih memilih npm, lalu pnpm, lalu bun; Node tetap runtime Gateway yang direkomendasikan).

## Mode lokal vs remote

- **Local** (default): aplikasi melampirkan ke Gateway lokal yang sedang berjalan jika ada;
  jika tidak, aplikasi mengaktifkan layanan launchd melalui `openclaw gateway install`.
- **Remote**: aplikasi terhubung ke Gateway melalui SSH/Tailscale dan tidak pernah memulai
  proses lokal.
  Aplikasi memulai **layanan host node** lokal agar Gateway remote dapat menjangkau Mac ini.
  Aplikasi tidak men-spawn Gateway sebagai child process.
  Discovery Gateway sekarang lebih memilih nama MagicDNS Tailscale daripada IP tailnet mentah,
  sehingga aplikasi Mac pulih lebih andal saat IP tailnet berubah.

## Kontrol Launchd

Aplikasi mengelola LaunchAgent per pengguna berlabel `ai.openclaw.gateway`
(atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; label lama `com.openclaw.*` tetap dapat di-unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profile bernama.

Jika LaunchAgent belum terinstal, aktifkan dari aplikasi atau jalankan
`openclaw gateway install`.

## Kapabilitas node (mac)

Aplikasi macOS menampilkan dirinya sebagai node. Perintah umum:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Layar: `screen.snapshot`, `screen.record`
- Sistem: `system.run`, `system.notify`

Node melaporkan peta `permissions` agar agen dapat memutuskan apa yang diizinkan.

Layanan node + IPC aplikasi:

- Saat layanan host node headless berjalan (mode remote), layanan itu terhubung ke WebSocket Gateway sebagai node.
- `system.run` dieksekusi di aplikasi macOS (konteks UI/TCC) melalui socket Unix lokal; prompt + output tetap berada di aplikasi.

Diagram (SCI):

```
Gateway -> Layanan Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Aplikasi Mac (UI + TCC + system.run)
```

## Persetujuan exec (`system.run`)

`system.run` dikontrol oleh **Persetujuan Exec** di aplikasi macOS (Settings → Exec approvals).
Keamanan + ask + allowlist disimpan secara lokal di Mac dalam:

```
~/.openclaw/exec-approvals.json
```

Contoh:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Catatan:

- Entri `allowlist` adalah pola glob untuk path biner hasil resolve.
- Teks perintah shell mentah yang mengandung sintaks kontrol atau ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai miss allowlist dan memerlukan persetujuan eksplisit (atau allowlisting biner shell).
- Memilih “Always Allow” di prompt menambahkan perintah itu ke allowlist.
- Override lingkungan `system.run` difilter (membuang `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) lalu digabungkan dengan lingkungan aplikasi.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override lingkungan bercakupan permintaan direduksi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable bagian dalam alih-alih path wrapper. Jika unwrapping tidak aman, tidak ada entri allowlist yang dipersistensikan secara otomatis.

## Deep link

Aplikasi mendaftarkan skema URL `openclaw://` untuk aksi lokal.

### `openclaw://agent`

Memicu permintaan `agent` ke Gateway.
__OC_I18N_900004__
Parameter query:

- `message` (wajib)
- `sessionKey` (opsional)
- `thinking` (opsional)
- `deliver` / `to` / `channel` (opsional)
- `timeoutSeconds` (opsional)
- `key` (opsional, untuk mode unattended)

Keamanan:

- Tanpa `key`, aplikasi meminta konfirmasi.
- Tanpa `key`, aplikasi menerapkan batas pesan singkat untuk prompt konfirmasi dan mengabaikan `deliver` / `to` / `channel`.
- Dengan `key` yang valid, eksekusi berjalan tanpa pengawasan (ditujukan untuk otomatisasi pribadi).

## Alur onboarding (tipikal)

1. Instal dan jalankan **OpenClaw.app**.
2. Selesaikan checklist izin (prompt TCC).
3. Pastikan mode **Local** aktif dan Gateway berjalan.
4. Instal CLI jika Anda ingin akses terminal.

## Penempatan direktori status (macOS)

Hindari menaruh direktori status OpenClaw Anda di iCloud atau folder lain yang disinkronkan cloud.
Path yang didukung sinkronisasi dapat menambah latensi dan kadang menyebabkan race file-lock/sinkronisasi untuk
sesi dan kredensial.

Pilih path status lokal yang tidak disinkronkan seperti:
__OC_I18N_900005__
Jika `openclaw doctor` mendeteksi status di bawah:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

maka perintah itu akan memberi peringatan dan merekomendasikan pindah kembali ke path lokal.

## Alur kerja build & dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (atau Xcode)
- Package aplikasi: `scripts/package-mac-app.sh`

## Debug konektivitas Gateway (CLI macOS)

Gunakan CLI debug untuk menjalankan logika handshake dan discovery WebSocket Gateway yang sama
seperti yang digunakan aplikasi macOS, tanpa meluncurkan aplikasi.
__OC_I18N_900006__
Opsi connect:

- `--url <ws://host:port>`: timpa konfigurasi
- `--mode <local|remote>`: resolve dari konfigurasi (default: config atau local)
- `--probe`: paksa health probe baru
- `--timeout <ms>`: timeout permintaan (default: `15000`)
- `--json`: output terstruktur untuk diffing

Opsi discovery:

- `--include-local`: sertakan Gateway yang biasanya difilter sebagai “local”
- `--timeout <ms>`: jendela discovery keseluruhan (default: `2000`)
- `--json`: output terstruktur untuk diffing

Tip: bandingkan dengan `openclaw gateway discover --json` untuk melihat apakah
pipeline discovery aplikasi macOS (`local.` plus domain wide-area yang dikonfigurasi, dengan
fallback wide-area dan Tailscale Serve) berbeda dari
discovery berbasis `dns-sd` milik CLI Node.

## Plumbing koneksi remote (SSH tunnel)

Saat aplikasi macOS berjalan dalam mode **Remote**, aplikasi membuka SSH tunnel agar komponen UI lokal
dapat berbicara dengan Gateway remote seolah-olah Gateway itu ada di localhost.

### Control tunnel (port WebSocket Gateway)

- **Tujuan:** health check, status, Web Chat, konfigurasi, dan panggilan control-plane lainnya.
- **Port lokal:** port Gateway (default `18789`), selalu stabil.
- **Port remote:** port Gateway yang sama pada host remote.
- **Perilaku:** tidak ada port lokal acak; aplikasi menggunakan ulang tunnel sehat yang sudah ada
  atau me-restart-nya jika diperlukan.
- **Bentuk SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` dengan opsi BatchMode +
  ExitOnForwardFailure + keepalive.
- **Pelaporan IP:** SSH tunnel menggunakan loopback, sehingga Gateway akan melihat IP node
  sebagai `127.0.0.1`. Gunakan transport **Direct (ws/wss)** jika Anda ingin IP klien yang sebenarnya
  muncul (lihat [akses remote macOS](/id/platforms/mac/remote)).

Untuk langkah penyiapan, lihat [akses remote macOS](/id/platforms/mac/remote). Untuk detail
protokol, lihat [Protokol Gateway](/id/gateway/protocol).

## Dokumen terkait

- [Runbook Gateway](/id/gateway)
- [Gateway (macOS)](/id/platforms/mac/bundled-gateway)
- [Izin macOS](/id/platforms/mac/permissions)
- [Canvas](/id/platforms/mac/canvas)
