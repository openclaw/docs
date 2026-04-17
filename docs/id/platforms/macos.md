---
read_when:
    - Mengimplementasikan fitur aplikasi macOS
    - Mengubah siklus hidup Gateway atau bridging Node di macOS
summary: Aplikasi pendamping OpenClaw untuk macOS (bilah menu + broker Gateway)
title: Aplikasi macOS
x-i18n:
    generated_at: "2026-04-17T09:14:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# Pendamping OpenClaw untuk macOS (bilah menu + broker Gateway)

Aplikasi macOS adalah **pendamping bilah menu** untuk OpenClaw. Aplikasi ini menangani izin,
mengelola/terhubung ke Gateway secara lokal (launchd atau manual), dan mengekspos kemampuan macOS
ke agen sebagai sebuah node.

## Apa yang dilakukan

- Menampilkan notifikasi native dan status di bilah menu.
- Menangani prompt TCC (Notifikasi, Aksesibilitas, Perekaman Layar, Mikrofon,
  Pengenalan Ucapan, Otomatisasi/AppleScript).
- Menjalankan atau terhubung ke Gateway (lokal atau jarak jauh).
- Mengekspos tool khusus macOS (Canvas, Kamera, Perekaman Layar, `system.run`).
- Memulai layanan host node lokal dalam mode **remote** (launchd), dan menghentikannya dalam mode **local**.
- Secara opsional meng-host **PeekabooBridge** untuk otomatisasi UI.
- Menginstal CLI global (`openclaw`) atas permintaan melalui npm, pnpm, atau bun (aplikasi memprioritaskan npm, lalu pnpm, lalu bun; Node tetap menjadi runtime Gateway yang direkomendasikan).

## Mode local vs remote

- **Local** (default): aplikasi terhubung ke Gateway lokal yang sedang berjalan jika ada;
  jika tidak, aplikasi mengaktifkan layanan launchd melalui `openclaw gateway install`.
- **Remote**: aplikasi terhubung ke Gateway melalui SSH/Tailscale dan tidak pernah memulai
  proses lokal.
  Aplikasi memulai **layanan host node** lokal agar Gateway jarak jauh dapat menjangkau Mac ini.
  Aplikasi tidak men-spawn Gateway sebagai proses anak.
  Discovery Gateway sekarang memprioritaskan nama Tailscale MagicDNS dibanding IP tailnet mentah,
  sehingga aplikasi Mac pulih dengan lebih andal saat IP tailnet berubah.

## Kontrol launchd

Aplikasi mengelola LaunchAgent per-pengguna dengan label `ai.openclaw.gateway`
(atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` lama masih di-unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profile bernama.

Jika LaunchAgent belum terinstal, aktifkan dari aplikasi atau jalankan
`openclaw gateway install`.

## Kemampuan Node (mac)

Aplikasi macOS menampilkan dirinya sebagai sebuah node. Perintah umum:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Kamera: `camera.snap`, `camera.clip`
- Layar: `screen.snapshot`, `screen.record`
- Sistem: `system.run`, `system.notify`

Node melaporkan peta `permissions` agar agen dapat memutuskan apa yang diizinkan.

Layanan Node + IPC aplikasi:

- Saat layanan host node headless berjalan (mode remote), layanan tersebut terhubung ke Gateway WS sebagai node.
- `system.run` dijalankan di aplikasi macOS (konteks UI/TCC) melalui socket Unix lokal; prompt + output tetap di dalam aplikasi.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Persetujuan exec (`system.run`)

`system.run` dikendalikan oleh **Persetujuan exec** di aplikasi macOS (Pengaturan → Persetujuan exec).
Keamanan + tanya + allowlist disimpan secara lokal di Mac dalam:

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

- Entri `allowlist` adalah pola glob untuk path biner yang telah di-resolve.
- Teks perintah shell mentah yang berisi sintaks kontrol atau ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai allowlist miss dan memerlukan persetujuan eksplisit (atau menambahkan biner shell ke allowlist).
- Memilih “Always Allow” di prompt akan menambahkan perintah tersebut ke allowlist.
- Override environment `system.run` difilter (menghapus `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) lalu digabungkan dengan environment aplikasi.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override environment dengan cakupan permintaan dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu-izinkan dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable internal, bukan path wrapper. Jika unwrap tidak aman, tidak ada entri allowlist yang disimpan secara otomatis.

## Deep link

Aplikasi mendaftarkan skema URL `openclaw://` untuk aksi lokal.

### `openclaw://agent`

Memicu permintaan `agent` Gateway.
__OC_I18N_900004__
Parameter query:

- `message` (wajib)
- `sessionKey` (opsional)
- `thinking` (opsional)
- `deliver` / `to` / `channel` (opsional)
- `timeoutSeconds` (opsional)
- `key` (opsional, kunci mode tanpa pengawasan)

Keamanan:

- Tanpa `key`, aplikasi meminta konfirmasi.
- Tanpa `key`, aplikasi menerapkan batas pesan singkat untuk prompt konfirmasi dan mengabaikan `deliver` / `to` / `channel`.
- Dengan `key` yang valid, proses berjalan tanpa pengawasan (ditujukan untuk otomatisasi pribadi).

## Alur onboarding (umum)

1. Instal dan jalankan **OpenClaw.app**.
2. Selesaikan daftar periksa izin (prompt TCC).
3. Pastikan mode **Local** aktif dan Gateway berjalan.
4. Instal CLI jika Anda ingin akses terminal.

## Penempatan direktori state (macOS)

Hindari menempatkan direktori state OpenClaw Anda di iCloud atau folder lain yang disinkronkan ke cloud.
Path yang didukung sinkronisasi dapat menambah latensi dan sesekali menyebabkan race file-lock/sinkronisasi untuk
sesi dan kredensial.

Utamakan path state lokal yang tidak disinkronkan seperti:
__OC_I18N_900005__
Jika `openclaw doctor` mendeteksi state di bawah:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

aplikasi akan memperingatkan dan merekomendasikan untuk memindahkannya kembali ke path lokal.

## Workflow build & pengembangan (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (atau Xcode)
- Paketkan aplikasi: `scripts/package-mac-app.sh`

## Debug konektivitas gateway (CLI macOS)

Gunakan CLI debug untuk menguji logika handshake dan discovery WebSocket Gateway yang sama
dengan yang digunakan aplikasi macOS, tanpa meluncurkan aplikasi.
__OC_I18N_900006__
Opsi connect:

- `--url <ws://host:port>`: override config
- `--mode <local|remote>`: resolve dari config (default: config atau local)
- `--probe`: paksa health probe baru
- `--timeout <ms>`: request timeout (default: `15000`)
- `--json`: output terstruktur untuk diffing

Opsi discovery:

- `--include-local`: sertakan gateway yang seharusnya difilter sebagai “local”
- `--timeout <ms>`: jendela discovery keseluruhan (default: `2000`)
- `--json`: output terstruktur untuk diffing

Tips: bandingkan dengan `openclaw gateway discover --json` untuk melihat apakah
pipeline discovery aplikasi macOS (`local.` ditambah domain wide-area yang dikonfigurasi, dengan
fallback wide-area dan Tailscale Serve) berbeda dari
discovery berbasis `dns-sd` milik CLI Node.

## Plumbing koneksi remote (tunnel SSH)

Saat aplikasi macOS berjalan dalam mode **Remote**, aplikasi membuka tunnel SSH agar komponen UI lokal
dapat berbicara dengan Gateway jarak jauh seolah-olah berada di localhost.

### Tunnel kontrol (port WebSocket Gateway)

- **Tujuan:** health check, status, Web Chat, config, dan panggilan control-plane lainnya.
- **Port lokal:** port Gateway (default `18789`), selalu stabil.
- **Port remote:** port Gateway yang sama pada host remote.
- **Perilaku:** tidak ada port lokal acak; aplikasi menggunakan kembali tunnel sehat yang ada
  atau memulainya ulang jika diperlukan.
- **Bentuk SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` dengan opsi BatchMode +
  ExitOnForwardFailure + keepalive.
- **Pelaporan IP:** tunnel SSH menggunakan loopback, sehingga gateway akan melihat
  IP node sebagai `127.0.0.1`. Gunakan transport **Direct (ws/wss)** jika Anda ingin IP klien
  yang sebenarnya muncul (lihat [akses remote macOS](/id/platforms/mac/remote)).

Untuk langkah penyiapan, lihat [akses remote macOS](/id/platforms/mac/remote). Untuk detail
protokol, lihat [protokol Gateway](/id/gateway/protocol).

## Dokumen terkait

- [Runbook Gateway](/id/gateway)
- [Gateway (macOS)](/id/platforms/mac/bundled-gateway)
- [Izin macOS](/id/platforms/mac/permissions)
- [Canvas](/id/platforms/mac/canvas)
