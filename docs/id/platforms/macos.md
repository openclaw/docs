---
read_when:
    - Menerapkan fitur aplikasi macOS
    - Mengubah siklus hidup gateway atau bridging node di macOS
summary: Aplikasi pendamping OpenClaw untuk macOS (bilah menu + broker gateway)
title: aplikasi macOS
x-i18n:
    generated_at: "2026-06-27T17:43:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** untuk OpenClaw. Aplikasi ini mengelola izin,
mengelola/menempel ke Gateway secara lokal (launchd atau manual), dan mengekspos kemampuan
macOS ke agen sebagai Node.

## Yang dilakukan

- Menampilkan notifikasi native dan status di bilah menu.
- Mengelola prompt TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Menjalankan atau terhubung ke Gateway (lokal atau remote).
- Mengekspos alat khusus macOS (Canvas, Camera, Screen Recording, `system.run`).
- Memulai layanan host Node lokal dalam mode **remote** (launchd), dan menghentikannya dalam mode **lokal**.
- Secara opsional menghosting **PeekabooBridge** untuk otomatisasi UI.
- Menginstal CLI global (`openclaw`) atas permintaan melalui npm, pnpm, atau bun (aplikasi lebih memilih npm, lalu pnpm, lalu bun; Node tetap menjadi runtime Gateway yang direkomendasikan).

## Mode lokal vs remote

- **Lokal** (default): aplikasi menempel ke Gateway lokal yang sedang berjalan jika ada;
  jika tidak, aplikasi mengaktifkan layanan launchd melalui `openclaw gateway install`.
- **Remote**: aplikasi terhubung ke Gateway melalui SSH/Tailscale dan tidak pernah memulai
  proses lokal.
  Aplikasi memulai **layanan host Node** lokal agar Gateway remote dapat menjangkau Mac ini.
  Aplikasi tidak menjalankan Gateway sebagai proses anak.
  Penemuan Gateway kini lebih memilih nama Tailscale MagicDNS daripada IP tailnet mentah,
  sehingga aplikasi Mac pulih lebih andal saat IP tailnet berubah.

## Kontrol launchd

Aplikasi mengelola LaunchAgent per pengguna berlabel `ai.openclaw.gateway`
(atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` lama tetap di-unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profil bernama.

Jika LaunchAgent belum diinstal, aktifkan dari aplikasi atau jalankan
`openclaw gateway install`.

Jika gateway berulang kali menghilang selama beberapa menit hingga jam dan hanya kembali saat Anda menyentuh Control UI atau SSH ke host, lihat catatan pemecahan masalah untuk macOS Maintenance Sleep / crash `ENETDOWN` dan gerbang perlindungan respawn launchd di [Pemecahan masalah Gateway](/id/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Kemampuan Node (mac)

Aplikasi macOS menampilkan dirinya sebagai Node. Perintah umum:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node melaporkan peta `permissions` agar agen dapat memutuskan apa yang diizinkan.

Layanan Node + IPC aplikasi:

- Saat layanan host Node headless berjalan (mode remote), layanan tersebut terhubung ke Gateway WS sebagai Node.
- `system.run` dieksekusi di aplikasi macOS (konteks UI/TCC) melalui soket Unix lokal; prompt + output tetap berada di dalam aplikasi.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Persetujuan eksekusi (system.run)

`system.run` dikendalikan oleh **Exec approvals** di aplikasi macOS (Settings → Exec approvals).
Keamanan + tanya + allowlist disimpan secara lokal di Mac di:

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

- Entri `allowlist` adalah pola glob untuk path biner yang sudah di-resolve, atau nama perintah polos untuk perintah yang dipanggil melalui PATH.
- Teks perintah shell mentah yang berisi sintaks kontrol atau ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai miss allowlist dan memerlukan persetujuan eksplisit (atau memasukkan biner shell ke allowlist).
- Memilih "Always Allow" dalam prompt menambahkan perintah tersebut ke allowlist.
- Override lingkungan `system.run` difilter (menghapus `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) lalu digabungkan dengan lingkungan aplikasi.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override lingkungan dalam cakupan permintaan dikurangi menjadi allowlist eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu izinkan dalam mode allowlist, wrapper dispatch yang dikenal (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) mempertahankan path executable bagian dalam, bukan path wrapper. Jika unwrapping tidak aman, tidak ada entri allowlist yang dipertahankan secara otomatis.

## Deep link

Aplikasi mendaftarkan skema URL `openclaw://` untuk tindakan lokal.

### `openclaw://agent`

Memicu permintaan `agent` Gateway.
__OC_I18N_900004__
Parameter kueri:

- `message` (wajib)
- `sessionKey` (opsional)
- `thinking` (opsional)
- `deliver` / `to` / `channel` (opsional)
- `timeoutSeconds` (opsional)
- `key` (kunci mode tanpa pengawasan opsional)

Keamanan:

- Tanpa `key`, aplikasi meminta konfirmasi.
- Tanpa `key`, aplikasi memberlakukan batas pesan singkat untuk prompt konfirmasi dan mengabaikan `deliver` / `to` / `channel`.
- Dengan `key` yang valid, proses berjalan tanpa pengawasan (ditujukan untuk otomatisasi pribadi).

## Alur onboarding (umum)

1. Instal dan jalankan **OpenClaw.app**.
2. Selesaikan daftar periksa izin (prompt TCC).
3. Pastikan mode **Lokal** aktif dan Gateway berjalan.
4. Instal CLI jika Anda menginginkan akses terminal.

## Penempatan direktori state (macOS)

Hindari menaruh direktori state OpenClaw Anda di iCloud atau folder lain yang disinkronkan cloud.
Path yang didukung sinkronisasi dapat menambah latensi dan sesekali menyebabkan race file-lock/sinkronisasi untuk
sesi dan kredensial.

Lebih baik gunakan path state lokal yang tidak disinkronkan seperti:
__OC_I18N_900005__
Jika `openclaw doctor` mendeteksi state di bawah:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

maka akan memberi peringatan dan merekomendasikan pemindahan kembali ke path lokal.

## Alur kerja build dan dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (atau Xcode)
- Paketkan aplikasi: `scripts/package-mac-app.sh`

## Debug konektivitas gateway (CLI macOS)

Gunakan CLI debug untuk menjalankan handshake Gateway WebSocket dan logika penemuan yang sama
dengan yang digunakan aplikasi macOS, tanpa meluncurkan aplikasi.
__OC_I18N_900006__
Opsi koneksi:

- `--url <ws://host:port>`: override konfigurasi
- `--mode <local|remote>`: resolve dari konfigurasi (default: konfigurasi atau lokal)
- `--probe`: paksa probe kesehatan baru
- `--timeout <ms>`: timeout permintaan (default: `15000`)
- `--json`: output terstruktur untuk diff

Opsi penemuan:

- `--include-local`: sertakan gateway yang akan difilter sebagai "lokal"
- `--timeout <ms>`: jendela penemuan keseluruhan (default: `2000`)
- `--json`: output terstruktur untuk diff

<Tip>
Bandingkan dengan `openclaw gateway discover --json` untuk melihat apakah pipeline penemuan aplikasi macOS (`local.` ditambah domain wide-area yang dikonfigurasi, dengan fallback wide-area dan Tailscale Serve) berbeda dari penemuan berbasis `dns-sd` milik CLI Node.
</Tip>

## Plumbing koneksi remote (tunnel SSH)

Saat aplikasi macOS berjalan dalam mode **Remote**, aplikasi membuka tunnel SSH agar komponen UI lokal
dapat berbicara ke Gateway remote seolah-olah berada di localhost.

### Tunnel kontrol (port Gateway WebSocket)

- **Tujuan:** pemeriksaan kesehatan, status, Web Chat, konfigurasi, dan panggilan control-plane lainnya.
- **Port lokal:** port Gateway (default `18789`), selalu stabil.
- **Port remote:** port Gateway yang sama di host remote.
- **Perilaku:** tidak ada port lokal acak; aplikasi menggunakan kembali tunnel sehat yang ada
  atau memulai ulangnya jika perlu.
- **Bentuk SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` dengan opsi BatchMode +
  ExitOnForwardFailure + keepalive.
- **Pelaporan IP:** tunnel SSH menggunakan loopback, sehingga gateway akan melihat IP Node
  sebagai `127.0.0.1`. Gunakan transport **Direct (ws/wss)** jika Anda ingin IP klien asli
  muncul (lihat [akses remote macOS](/id/platforms/mac/remote)).

Untuk langkah penyiapan, lihat [akses remote macOS](/id/platforms/mac/remote). Untuk detail
protokol, lihat [Protokol Gateway](/id/gateway/protocol).

## Dokumentasi terkait

- [Runbook Gateway](/id/gateway)
- [Gateway (macOS)](/id/platforms/mac/bundled-gateway)
- [Izin macOS](/id/platforms/mac/permissions)
- [Canvas](/id/platforms/mac/canvas)
