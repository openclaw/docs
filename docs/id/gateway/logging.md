---
read_when:
    - Mengubah output atau format logging
    - Men-debug output CLI atau gateway
summary: Permukaan logging, log file, gaya log WS, dan pemformatan konsol
title: Logging Gateway
x-i18n:
    generated_at: "2026-04-24T09:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# Logging

Untuk ikhtisar yang berorientasi pengguna (CLI + UI Control + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua “permukaan” log:

- **Output konsol** (apa yang Anda lihat di terminal / UI Debug).
- **Log file** (baris JSON) yang ditulis oleh logger gateway.

## Logger berbasis file

- Log file rolling default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host gateway.
- Path dan level log file dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Logs di UI Control melakukan tail file ini melalui gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikendalikan secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbosity konsol** (dan gaya log WS); flag ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail khusus-verbose di log file, atur `logging.level` ke `debug` atau
  `trace`.

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyetel verbosity konsol secara independen melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi ringkasan alat

Ringkasan alat verbose (misalnya `🛠️ Exec: ...`) dapat menutupi token sensitif sebelum mencapai
stream konsol. Ini **khusus alat** dan tidak mengubah log file.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (mengoverride default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda membutuhkan flag khusus.
  - Kecocokan dimask dengan mempertahankan 6 karakter pertama + 4 terakhir (panjang >= 18), jika tidak `***`.
  - Default mencakup penetapan key umum, flag CLI, field JSON, header bearer, blok PEM, dan prefix token populer.

## Log Gateway WebSocket

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “menarik” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error parse
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung pengubah gaya per-gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output compact
- `--ws-log compact`: output compact (permintaan/respons berpasangan) saat verbose
- `--ws-log full`: output penuh per-frame saat verbose
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

Pemformat konsol **sadar TTY** dan mencetak baris konsisten dengan prefix.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefix subsistem** di setiap baris (misalnya `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) ditambah pewarnaan level
- **Warna saat output adalah TTY atau environment terlihat seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefix subsistem yang dipendekkan**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (misalnya `whatsapp/outbound`)
- **Sub-logger per subsistem** (prefix otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefix, tanpa pemformatan)
- **Gaya konsol** (misalnya `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file tetap menyimpan detail penuh saat `logging.level` diatur ke `debug`/`trace`)
- **Body pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sambil membuat output interaktif mudah dipindai.

## Terkait

- [Ikhtisar logging](/id/logging)
- [Ekspor diagnostik](/id/gateway/diagnostics)
