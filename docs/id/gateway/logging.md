---
read_when:
    - Mengubah output atau format logging
    - Men-debug output CLI atau gateway
summary: Permukaan logging, log file, gaya log WS, dan pemformatan konsol
title: Logging Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 465fe66ae6a3bc844e75d3898aed15b3371481c4fe89ede40e5a9377e19bb74c
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Untuk ikhtisar yang ditujukan bagi pengguna (CLI + UI Kontrol + konfigurasi), lihat [/logging](/logging).

OpenClaw memiliki dua “permukaan” log:

- **Output konsol** (apa yang Anda lihat di terminal / UI Debug).
- **Log file** (baris JSON) yang ditulis oleh logger gateway.

## Logger berbasis file

- File log bergulir default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host gateway.
- Path dan level file log dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Logs di UI Kontrol melakukan tail pada file ini melalui gateway (`logs.tail`).
CLI juga dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikendalikan secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbositas konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail yang hanya muncul di verbose dalam log file, setel `logging.level` ke `debug` atau
  `trace`.

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menulisnya ke log file,
sambil tetap mencetaknya ke stdout/stderr.

Anda dapat menyetel verbositas konsol secara terpisah melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi ringkasan tool

Ringkasan tool verbose (misalnya `🛠️ Exec: ...`) dapat menyamarkan token sensitif sebelum mencapai
stream konsol. Ini **khusus tool** dan tidak mengubah log file.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (menimpa default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda memerlukan flag kustom.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak maka `***`.
  - Default mencakup assignment kunci umum, flag CLI, field JSON, header bearer, blok PEM, dan prefiks token populer.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “menarik” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - parse error
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas request/response WS.

### Gaya log WS

`openclaw gateway` mendukung pengalihan gaya per gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (request/response berpasangan) saat verbose
- `--ws-log full`: output penuh per frame saat verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
# dioptimalkan (hanya error/lambat)
openclaw gateway

# tampilkan semua lalu lintas WS (berpasangan)
openclaw gateway --verbose --ws-log compact

# tampilkan semua lalu lintas WS (meta penuh)
openclaw gateway --verbose --ws-log full
```

## Pemformatan konsol (logging subsistem)

Formatter konsol **sadar TTY** dan mencetak baris yang konsisten dengan prefiks.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** di setiap baris (misalnya `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) ditambah pewarnaan level
- **Warna saat output berupa TTY atau lingkungan tampak seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipersingkat**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (misalnya `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (misalnya `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file tetap menyimpan detail penuh ketika `logging.level` disetel ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada level `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sambil membuat output interaktif mudah dipindai.
