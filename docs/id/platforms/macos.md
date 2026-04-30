---
read_when:
    - Mengimplementasikan fitur aplikasi macOS
    - Mengubah siklus hidup Gateway atau penjembatanan node di macOS
summary: Aplikasi pendamping OpenClaw untuk macOS (bilah menu + broker Gateway)
title: aplikasi macOS
x-i18n:
    generated_at: "2026-04-30T09:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

Aplikasi macOS adalah **pendamping bilah menu** untuk OpenClaw. Aplikasi ini menangani izin,
mengelola/menautkan ke Gateway secara lokal (launchd atau manual), dan mengekspos kemampuan
macOS kepada agen sebagai Node.

## Apa yang dilakukannya

- Menampilkan notifikasi native dan status di bilah menu.
- Menangani prompt TCC (Notifications, Accessibility, Screen Recording, Microphone,
  Speech Recognition, Automation/AppleScript).
- Menjalankan atau terhubung ke Gateway (lokal atau jarak jauh).
- Mengekspos alat khusus macOS (Canvas, Camera, Screen Recording, `system.run`).
- Memulai layanan host Node lokal dalam mode **jarak jauh** (launchd), dan menghentikannya dalam mode **lokal**.
- Secara opsional menghosting **PeekabooBridge** untuk otomasi UI.
- Menginstal CLI global (`openclaw`) atas permintaan melalui npm, pnpm, atau bun (aplikasi lebih memilih npm, lalu pnpm, lalu bun; Node tetap merupakan runtime Gateway yang direkomendasikan).

## Mode lokal vs jarak jauh

- **Lokal** (default): aplikasi menaut ke Gateway lokal yang sedang berjalan jika ada;
  jika tidak, aplikasi mengaktifkan layanan launchd melalui `openclaw gateway install`.
- **Jarak jauh**: aplikasi terhubung ke Gateway melalui SSH/Tailscale dan tidak pernah memulai
  proses lokal.
  Aplikasi memulai **layanan host Node** lokal agar Gateway jarak jauh dapat menjangkau Mac ini.
  Aplikasi tidak memunculkan Gateway sebagai proses turunan.
  Penemuan Gateway kini lebih memilih nama Tailscale MagicDNS daripada IP tailnet mentah,
  sehingga aplikasi Mac pulih lebih andal saat IP tailnet berubah.

## Kontrol launchd

Aplikasi mengelola LaunchAgent per pengguna berlabel `ai.openclaw.gateway`
(atau `ai.openclaw.<profile>` saat menggunakan `--profile`/`OPENCLAW_PROFILE`; legacy `com.openclaw.*` tetap dibongkar).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ganti label dengan `ai.openclaw.<profile>` saat menjalankan profil bernama.

Jika LaunchAgent belum diinstal, aktifkan dari aplikasi atau jalankan
`openclaw gateway install`.

## Kemampuan Node (mac)

Aplikasi macOS menampilkan dirinya sebagai Node. Perintah umum:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node melaporkan peta `permissions` agar agen dapat menentukan apa yang diizinkan.

Layanan Node + IPC aplikasi:

- Saat layanan host Node headless berjalan (mode jarak jauh), layanan ini terhubung ke Gateway WS sebagai Node.
- `system.run` dieksekusi di aplikasi macOS (konteks UI/TCC) melalui soket Unix lokal; prompt + output tetap di dalam aplikasi.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Persetujuan eksekusi (`system.run`)

`system.run` dikendalikan oleh **Persetujuan eksekusi** di aplikasi macOS (Settings → Persetujuan eksekusi).
Keamanan + permintaan + daftar izin disimpan secara lokal di Mac di:

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
- Teks perintah shell mentah yang berisi sintaks kontrol atau ekspansi shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) diperlakukan sebagai miss daftar izin dan memerlukan persetujuan eksplisit (atau memasukkan biner shell ke daftar izin).
- Memilih “Selalu Izinkan” dalam prompt menambahkan perintah tersebut ke daftar izin.
- Override environment `system.run` difilter (menghapus `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) lalu digabungkan dengan environment aplikasi.
- Untuk wrapper shell (`bash|sh|zsh ... -c/-lc`), override environment dengan cakupan permintaan dikurangi menjadi daftar izin eksplisit kecil (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Untuk keputusan selalu izinkan dalam mode daftar izin, wrapper dispatch yang dikenal (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) menyimpan path executable dalam, bukan path wrapper. Jika pembukaan wrapper tidak aman, tidak ada entri daftar izin yang disimpan secara otomatis.

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
- Tanpa `key`, aplikasi menerapkan batas pesan pendek untuk prompt konfirmasi dan mengabaikan `deliver` / `to` / `channel`.
- Dengan `key` yang valid, proses berjalan tanpa pengawasan (ditujukan untuk otomasi pribadi).

## Alur onboarding (umum)

1. Instal dan luncurkan **OpenClaw.app**.
2. Selesaikan daftar periksa izin (prompt TCC).
3. Pastikan mode **Lokal** aktif dan Gateway berjalan.
4. Instal CLI jika Anda menginginkan akses terminal.

## Penempatan direktori state (macOS)

Hindari menaruh direktori state OpenClaw Anda di iCloud atau folder lain yang disinkronkan ke cloud.
Path yang didukung sinkronisasi dapat menambah latensi dan sesekali menyebabkan race penguncian file/sinkronisasi untuk
sesi dan kredensial.

Sebaiknya gunakan path state lokal yang tidak disinkronkan seperti:
__OC_I18N_900005__
Jika `openclaw doctor` mendeteksi state di bawah:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

perintah tersebut akan memperingatkan dan merekomendasikan pemindahan kembali ke path lokal.

## Alur kerja build & dev (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (atau Xcode)
- Paketkan aplikasi: `scripts/package-mac-app.sh`

## Debug konektivitas Gateway (CLI macOS)

Gunakan CLI debug untuk menjalankan handshake WebSocket Gateway dan logika penemuan
yang sama dengan yang digunakan aplikasi macOS, tanpa meluncurkan aplikasi.
__OC_I18N_900006__
Opsi koneksi:

- `--url <ws://host:port>`: override konfigurasi
- `--mode <local|remote>`: resolve dari konfigurasi (default: konfigurasi atau lokal)
- `--probe`: paksa probe kesehatan baru
- `--timeout <ms>`: timeout permintaan (default: `15000`)
- `--json`: output terstruktur untuk diffing

Opsi penemuan:

- `--include-local`: sertakan Gateway yang akan difilter sebagai “lokal”
- `--timeout <ms>`: jendela penemuan keseluruhan (default: `2000`)
- `--json`: output terstruktur untuk diffing

<Tip>
Bandingkan dengan `openclaw gateway discover --json` untuk melihat apakah pipeline penemuan aplikasi macOS (`local.` ditambah domain area luas yang dikonfigurasi, dengan fallback area luas dan Tailscale Serve) berbeda dari penemuan berbasis `dns-sd` milik CLI Node.
</Tip>

## Plumbing koneksi jarak jauh (tunnel SSH)

Saat aplikasi macOS berjalan dalam mode **Jarak jauh**, aplikasi membuka tunnel SSH agar komponen UI lokal
dapat berbicara dengan Gateway jarak jauh seolah-olah berada di localhost.

### Tunnel kontrol (port WebSocket Gateway)

- **Tujuan:** pemeriksaan kesehatan, status, Web Chat, konfigurasi, dan panggilan control-plane lainnya.
- **Port lokal:** port Gateway (default `18789`), selalu stabil.
- **Port jarak jauh:** port Gateway yang sama di host jarak jauh.
- **Perilaku:** tidak ada port lokal acak; aplikasi menggunakan ulang tunnel sehat yang ada
  atau memulai ulangnya jika perlu.
- **Bentuk SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` dengan BatchMode +
  ExitOnForwardFailure + opsi keepalive.
- **Pelaporan IP:** tunnel SSH menggunakan loopback, sehingga Gateway akan melihat IP Node
  sebagai `127.0.0.1`. Gunakan transport **Direct (ws/wss)** jika Anda ingin IP klien asli
  muncul (lihat [akses jarak jauh macOS](/id/platforms/mac/remote)).

Untuk langkah penyiapan, lihat [akses jarak jauh macOS](/id/platforms/mac/remote). Untuk detail
protokol, lihat [protokol Gateway](/id/gateway/protocol).

## Dokumen terkait

- [Runbook Gateway](/id/gateway)
- [Gateway (macOS)](/id/platforms/mac/bundled-gateway)
- [Izin macOS](/id/platforms/mac/permissions)
- [Canvas](/id/platforms/mac/canvas)
