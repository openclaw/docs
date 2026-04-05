---
read_when:
    - Mengimplementasikan fitur app macOS
    - Mengubah siklus hidup gateway atau bridging node di macOS
summary: App pendamping macOS OpenClaw (menu bar + broker gateway)
title: App macOS
x-i18n:
    generated_at: "2026-04-05T14:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# Pendamping macOS OpenClaw (menu bar + broker gateway)

App macOS adalah **pendamping menu bar** untuk OpenClaw. App ini memiliki izin,
mengelola/terhubung ke Gateway secara lokal (launchd atau manual), dan mengekspos
kapabilitas macOS ke agen sebagai node.

## Yang dilakukan

- Menampilkan notifikasi native dan status di menu bar.
- Memiliki prompt TCC (Notifikasi, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Menjalankan atau terhubung ke Gateway (lokal atau remote).
- Mengekspos tool khusus macOS (Canvas, Camera, Screen Recording, `system.run`).
- Memulai layanan host node lokal dalam mode **remote** (launchd), dan menghentikannya dalam mode **local**.
- Secara opsional meng-host **PeekabooBridge** untuk otomatisasi UI.
- Menginstal CLI global (`openclaw`) sesuai permintaan melalui npm, pnpm, atau bun (app lebih memilih npm, lalu pnpm, lalu bun; Node tetap menjadi runtime Gateway yang direkomendasikan).

## Mode lokal vs remote

- **Local** (default): app terhubung ke Gateway lokal yang sedang berjalan jika ada;
  jika tidak, app mengaktifkan layanan launchd melalui `openclaw gateway install`.
- **Remote**: app terhubung ke Gateway melalui SSH/Tailscale dan tidak pernah memulai
  proses lokal.
  App memulai **layanan host node** lokal agar Gateway remote dapat menjangkau Mac ini.
  App tidak menjalankan Gateway sebagai child process.
  Discovery Gateway sekarang lebih mengutamakan nama Tailscale MagicDNS daripada IP tailnet mentah,
  sehingga app Mac pulih dengan lebih andal saat IP tailnet berubah.

## Kontrol Launchd

App mengelola LaunchAgent per pengguna berlabel `ai.openclaw.gateway`
(atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` lama masih akan di-unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profile bernama.

Jika LaunchAgent belum terinstal, aktifkan dari app atau jalankan
`openclaw gateway install`.

## Kapabilitas node (mac)

App macOS menampilkan dirinya sebagai node. Perintah umum:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.record`
- System: `system.run`, `system.notify`

Node melaporkan peta `permissions` agar agen dapat memutuskan apa yang diizinkan.

Layanan node + IPC app:

- Saat layanan host node headless berjalan (mode remote), layanan ini terhubung ke Gateway WS sebagai node.
- `system.run` dijalankan di app macOS (konteks UI/TCC) melalui Unix socket lokal; prompt + output tetap berada di dalam app.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals (`system.run`)

`system.run` dikendalikan oleh **Exec approvals** di app macOS (Settings → Exec approvals).
Security + ask + allowlist disimpan secara lokal di Mac dalam:

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

- Entri `allowlist` adalah pola glob untuk jalur binary yang sudah di-resolve.
- Teks perintah shell mentah yang berisi sintaks kontrol atau ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai kegagalan allowlist dan memerlukan persetujuan eksplisit (atau memasukkan binary shell ke allowlist).
- Memilih “Always Allow” pada prompt menambahkan perintah tersebut ke allowlist.
- Override environment `system.run` difilter (menghapus `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) lalu digabungkan dengan environment app.
- Untuk shell wrapper (`bash|sh|zsh ... -c/-lc`), override environment dengan cakupan permintaan dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan allow-always dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan jalur executable bagian dalam, bukan jalur wrapper. Jika unwrapping tidak aman, tidak ada entri allowlist yang disimpan otomatis.

## Deep link

App mendaftarkan skema URL `openclaw://` untuk tindakan lokal.

### `openclaw://agent`

Memicu permintaan `agent` Gateway.
__OC_I18N_900004__
Parameter kueri:

- `message` (wajib)
- `sessionKey` (opsional)
- `thinking` (opsional)
- `deliver` / `to` / `channel` (opsional)
- `timeoutSeconds` (opsional)
- `key` (opsional, kunci mode tanpa pengawasan)

Keamanan:

- Tanpa `key`, app meminta konfirmasi.
- Tanpa `key`, app menerapkan batas pesan singkat untuk prompt konfirmasi dan mengabaikan `deliver` / `to` / `channel`.
- Dengan `key` yang valid, eksekusi berjalan tanpa pengawasan (ditujukan untuk otomatisasi pribadi).

## Alur onboarding (umum)

1. Instal dan jalankan **OpenClaw.app**.
2. Selesaikan checklist izin (prompt TCC).
3. Pastikan mode **Local** aktif dan Gateway berjalan.
4. Instal CLI jika Anda menginginkan akses terminal.

## Penempatan state dir (macOS)

Hindari menempatkan state dir OpenClaw Anda di iCloud atau folder lain yang disinkronkan ke cloud.
Jalur yang didukung sinkronisasi dapat menambah latensi dan terkadang menyebabkan race file-lock/sinkronisasi untuk
sesi dan kredensial.

Lebih baik gunakan jalur state lokal yang tidak disinkronkan seperti:
__OC_I18N_900005__
Jika `openclaw doctor` mendeteksi state di bawah:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

maka tool tersebut akan memperingatkan dan merekomendasikan pemindahan kembali ke jalur lokal.

## Alur build & dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (atau Xcode)
- Package app: `scripts/package-mac-app.sh`

## Debug konektivitas gateway (CLI macOS)

Gunakan CLI debug untuk menjalankan handshake WebSocket Gateway dan logika discovery yang sama
seperti yang digunakan app macOS, tanpa meluncurkan app.
__OC_I18N_900006__
Opsi connect:

- `--url <ws://host:port>`: override config
- `--mode <local|remote>`: resolve dari config (default: config atau local)
- `--probe`: paksa health probe baru
- `--timeout <ms>`: timeout permintaan (default: `15000`)
- `--json`: output terstruktur untuk diffing

Opsi discovery:

- `--include-local`: sertakan gateway yang akan difilter sebagai “local”
- `--timeout <ms>`: jendela discovery keseluruhan (default: `2000`)
- `--json`: output terstruktur untuk diffing

Tip: bandingkan dengan `openclaw gateway discover --json` untuk melihat apakah
pipeline discovery app macOS (`local.` ditambah domain wide-area yang dikonfigurasi, dengan
fallback wide-area dan Tailscale Serve) berbeda dari
discovery berbasis `dns-sd` milik Node CLI.

## Plumbing koneksi remote (tunnel SSH)

Saat app macOS berjalan dalam mode **Remote**, app membuka tunnel SSH agar komponen UI lokal
dapat berbicara dengan Gateway remote seolah-olah berada di localhost.

### Control tunnel (port WebSocket Gateway)

- **Tujuan:** health check, status, Web Chat, config, dan panggilan control-plane lainnya.
- **Port lokal:** port Gateway (default `18789`), selalu stabil.
- **Port remote:** port Gateway yang sama pada host remote.
- **Perilaku:** tidak ada port lokal acak; app menggunakan kembali tunnel sehat yang sudah ada
  atau me-restart-nya bila perlu.
- **Bentuk SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` dengan opsi BatchMode +
  ExitOnForwardFailure + keepalive.
- **Pelaporan IP:** tunnel SSH menggunakan loopback, jadi gateway akan melihat
  IP node sebagai `127.0.0.1`. Gunakan transport **Direct (ws/wss)** jika Anda ingin
  IP klien asli terlihat (lihat [akses remote macOS](/platforms/mac/remote)).

Untuk langkah penyiapan, lihat [akses remote macOS](/platforms/mac/remote). Untuk detail
protokol, lihat [Protokol gateway](/id/gateway/protocol).

## Dokumen terkait

- [Runbook Gateway](/id/gateway)
- [Gateway (macOS)](/platforms/mac/bundled-gateway)
- [Izin macOS](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)
