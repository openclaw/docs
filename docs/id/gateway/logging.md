---
read_when:
    - Mengubah keluaran atau format pencatatan log
    - Memecahkan masalah keluaran CLI atau Gateway
summary: Permukaan pencatatan log, berkas log, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-05-01T09:24:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f843812a41c25f9ca1884543ad3a5663c8e0bc327027cbd2b58ea6557c466aa9
    source_path: gateway/logging.md
    workflow: 16
---

# Pencatatan Log

Untuk ringkasan yang ditujukan bagi pengguna (CLI + Control UI + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua “permukaan” log:

- **Output konsol** (yang Anda lihat di terminal / Debug UI).
- **Log file** (baris JSON) yang ditulis oleh logger Gateway.

## Logger berbasis file

- File log bergilir default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host Gateway.
- File log aktif dirotasi pada `logging.maxFileBytes` (default: 100 MB), menyimpan
  hingga lima arsip bernomor dan terus menulis ke file aktif baru.
- Jalur file log dan levelnya dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Log Control UI mengikuti file ini melalui Gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikontrol secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbositas konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail khusus verbose dalam log file, atur `logging.level` ke `debug` atau
  `trace`.

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sembari tetap mencetak ke stdout/stderr.

Anda dapat menyetel verbositas konsol secara terpisah melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi

OpenClaw dapat menyamarkan token sensitif sebelum output log atau transkrip keluar dari
proses. Kebijakan redaksi logging ini diterapkan pada sink teks konsol, log file, record
log OTLP, dan transkrip sesi, sehingga nilai rahasia yang cocok disamarkan
sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (menimpa default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda memerlukan flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak `***`.
  - Default mencakup penetapan kunci umum, flag CLI, field JSON, header bearer, blok PEM, prefiks token populer, dan nama field kredensial pembayaran seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran.

Beberapa batas keselamatan selalu melakukan redaksi terlepas dari `logging.redactSensitive`.
Ini mencakup event pemanggilan alat Control UI, output alat `sessions_history`,
ekspor dukungan diagnostik, observasi error provider, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. Permukaan ini masih dapat menggunakan
`logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"`
tidak membuatnya memancarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “penting” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error parsing
- **Mode verbose (`--verbose`)**: mencetak semua traffic permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung sakelar gaya per-Gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (permintaan/respons berpasangan) saat verbose
- `--ws-log full`: output penuh per frame saat verbose
- `--compact`: alias untuk `--ws-log compact`

Contoh:

```bash
# dioptimalkan (hanya error/lambat)
openclaw gateway

# tampilkan semua traffic WS (berpasangan)
openclaw gateway --verbose --ws-log compact

# tampilkan semua traffic WS (meta penuh)
openclaw gateway --verbose --ws-log full
```

## Pemformatan konsol (logging subsistem)

Formatter konsol **sadar TTY** dan mencetak baris berprefiks yang konsisten.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (mis. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) plus pewarnaan level
- **Warna saat output adalah TTY atau lingkungan terlihat seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipendekkan**: menghapus awalan `gateway/` + `channels/`, mempertahankan 2 segmen terakhir (mis. `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (mis. `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file mempertahankan detail penuh saat `logging.level` diatur ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sembari membuat output interaktif mudah dipindai.

## Terkait

- [Pencatatan Log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
