---
read_when:
    - Mengubah keluaran atau format pencatatan log
    - Pemecahan masalah keluaran CLI atau Gateway
summary: Permukaan pencatatan log, log berbasis berkas, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-05-02T09:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# Logging

Untuk ringkasan yang ditujukan bagi pengguna (CLI + Control UI + config), lihat [/logging](/id/logging).

OpenClaw memiliki dua “permukaan” log:

- **Output konsol** (yang Anda lihat di terminal / Debug UI).
- **Log file** (baris JSON) yang ditulis oleh logger Gateway.

## Logger berbasis file

- File log bergulir bawaan berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host Gateway.
- File log aktif berotasi pada `logging.maxFileBytes` (bawaan: 100 MB), menyimpan
  hingga lima arsip bernomor dan terus menulis ke file aktif baru.
- Jalur dan level file log dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Log Control UI mengikuti file ini melalui Gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikendalikan secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **kerincian konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail khusus verbose dalam log file, atur `logging.level` ke `debug` atau
  `trace`.
- Logging trace juga mencakup ringkasan waktu diagnostik untuk jalur panas tertentu,
  seperti persiapan factory tool Plugin. Lihat
  [/tools/plugin#slow-plugin-tool-setup](/id/tools/plugin#slow-plugin-tool-setup).

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyetel kerincian konsol secara terpisah melalui:

- `logging.consoleLevel` (bawaan `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi

OpenClaw dapat menyamarkan token sensitif sebelum output log atau transkrip keluar dari
proses. Kebijakan redaksi logging ini diterapkan pada konsol, log file, catatan log OTLP,
dan sink teks transkrip sesi, sehingga nilai rahasia yang cocok disamarkan
sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (bawaan: `tools`)
- `logging.redactPatterns`: array string regex (menimpa bawaan)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda memerlukan flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak `***`.
  - Bawaan mencakup assignment key umum, flag CLI, field JSON, header bearer, blok PEM, prefix token populer, dan nama field kredensial pembayaran seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran.

Beberapa batas keamanan selalu melakukan redaksi terlepas dari `logging.redactSensitive`.
Ini mencakup event tool-call Control UI, output tool `sessions_history`,
ekspor dukungan diagnostik, observasi error penyedia, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. Permukaan ini masih dapat menggunakan
`logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"`
tidak membuatnya mengeluarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “menarik” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang bawaan: `>= 50ms`)
  - error parse
- **Mode verbose (`--verbose`)**: mencetak semua lalu lintas request/response WS.

### Gaya log WS

`openclaw gateway` mendukung switch gaya per Gateway:

- `--ws-log auto` (bawaan): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (request/response berpasangan) saat verbose
- `--ws-log full`: output penuh per frame saat verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## Pemformatan konsol (logging subsistem)

Formatter konsol **sadar TTY** dan mencetak baris berprefiks yang konsisten.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (mis. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) ditambah pewarnaan level
- **Warna saat output adalah TTY atau lingkungan terlihat seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipersingkat**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (mis. `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (mis. `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file mempertahankan detail penuh saat `logging.level` diatur ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sekaligus membuat output interaktif mudah dipindai.

## Terkait

- [Logging](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
