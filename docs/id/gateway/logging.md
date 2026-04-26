---
read_when:
    - Mengubah output atau format logging
    - Men-debug output CLI atau gateway
summary: Surface logging, log file, gaya log WS, dan pemformatan konsol
title: Logging Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c005cfc4cfe456b3734d3928a16c9cd131a2b465d46f2aba9c9c61db22dcc399
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Untuk ringkasan yang ditujukan bagi pengguna (CLI + UI Control + config), lihat [/logging](/id/logging).

OpenClaw memiliki dua “surface” log:

- **Output konsol** (apa yang Anda lihat di terminal / UI Debug).
- **Log file** (baris JSON) yang ditulis oleh logger gateway.

## Logger berbasis file

- Log file rolling default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host gateway.
- Log file aktif berotasi pada `logging.maxFileBytes` (default: 100 MB), menyimpan
  hingga lima arsip bernomor dan terus menulis ke file aktif baru.
- Path dan level log file dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Logs UI Control men-tail file ini melalui gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikendalikan secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbosity konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail yang hanya verbose dalam log file, setel `logging.level` ke `debug` atau
  `trace`.

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menulisnya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyetel verbosity konsol secara independen melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi ringkasan tool

Ringkasan tool verbose (misalnya `🛠️ Exec: ...`) dapat menutupi token sensitif sebelum mencapai
aliran konsol. Ini **khusus tool** dan tidak mengubah log file.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (mengoverride default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda memerlukan flag kustom.
  - Kecocokan ditutupi dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak `***`.
  - Default mencakup assignment kunci umum, flag CLI, field JSON, header bearer, blok PEM, dan prefiks token populer.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “menarik” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error parse
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung sakelar gaya per gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output compact
- `--ws-log compact`: output compact (permintaan/respons berpasangan) saat verbose
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

Formatter konsol **sadar TTY** dan mencetak baris yang konsisten serta berprefiks.
Logger subsistem menjaga output tetap dikelompokkan dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (misalnya `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) plus pewarnaan level
- **Warna saat output adalah TTY atau lingkungan terlihat seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipersingkat**: menghapus `gateway/` + `channels/` di depan, mempertahankan 2 segmen terakhir (misalnya `whatsapp/outbound`)
- **Sub-logger menurut subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (misalnya `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file tetap menyimpan detail penuh saat `logging.level` disetel ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sambil membuat output interaktif mudah dipindai.

## Terkait

- [Logging](/id/logging)
- [OpenTelemetry export](/id/gateway/opentelemetry)
- [Diagnostics export](/id/gateway/diagnostics)
