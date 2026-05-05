---
read_when:
    - Mengubah keluaran atau format log
    - Pemecahan masalah keluaran CLI atau Gateway
summary: Permukaan pencatatan log, log file, gaya log WS, dan pemformatan konsol
title: Pencatatan log Gateway
x-i18n:
    generated_at: "2026-05-05T01:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# Pencatatan Log

Untuk ikhtisar yang ditujukan bagi pengguna (CLI + Control UI + konfigurasi), lihat [/logging](/id/logging).

OpenClaw memiliki dua “permukaan” log:

- **Output konsol** (yang Anda lihat di terminal / Debug UI).
- **Log file** (baris JSON) yang ditulis oleh logger gateway.

Saat startup, Gateway mencatat model agen default yang telah diselesaikan bersama dengan
default mode yang memengaruhi sesi baru, misalnya:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` berasal dari agen default, parameter model, atau default agen global;
ketika tidak diatur, ringkasan startup menampilkan `medium`. `fast` berasal dari
parameter `fastMode` agen default atau model.

## Logger berbasis file

- File log bergulir default berada di bawah `/tmp/openclaw/` (satu file per hari): `openclaw-YYYY-MM-DD.log`
  - Tanggal menggunakan zona waktu lokal host gateway.
- File log aktif berotasi pada `logging.maxFileBytes` (default: 100 MB), mempertahankan
  hingga lima arsip bernomor dan terus menulis file aktif baru.
- Jalur dan level file log dapat dikonfigurasi melalui `~/.openclaw/openclaw.json`:
  - `logging.file`
  - `logging.level`

Format file adalah satu objek JSON per baris.

Tab Log Control UI mengikuti file ini melalui gateway (`logs.tail`).
CLI dapat melakukan hal yang sama:

```bash
openclaw logs --follow
```

**Verbose vs. level log**

- **Log file** dikontrol secara eksklusif oleh `logging.level`.
- `--verbose` hanya memengaruhi **verbositas konsol** (dan gaya log WS); ini **tidak**
  menaikkan level log file.
- Untuk menangkap detail yang hanya muncul dalam mode verbose di log file, atur `logging.level` ke `debug` atau
  `trace`.
- Pencatatan log trace juga mencakup ringkasan waktu diagnostik untuk hot path tertentu,
  seperti persiapan factory tool plugin. Lihat
  [/tools/plugin#slow-plugin-tool-setup](/id/tools/plugin#slow-plugin-tool-setup).

## Penangkapan konsol

CLI menangkap `console.log/info/warn/error/debug/trace` dan menuliskannya ke log file,
sambil tetap mencetak ke stdout/stderr.

Anda dapat menyesuaikan verbositas konsol secara independen melalui:

- `logging.consoleLevel` (default `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## Redaksi

OpenClaw dapat menyamarkan token sensitif sebelum output log atau transkrip keluar dari
proses. Kebijakan redaksi pencatatan log ini diterapkan pada sink teks konsol, file-log, rekaman-log OTLP,
dan transkrip sesi, sehingga nilai rahasia yang cocok disamarkan
sebelum baris JSONL atau pesan ditulis ke disk.

- `logging.redactSensitive`: `off` | `tools` (default: `tools`)
- `logging.redactPatterns`: array string regex (menimpa default)
  - Gunakan string regex mentah (otomatis `gi`), atau `/pattern/flags` jika Anda memerlukan flag khusus.
  - Kecocokan disamarkan dengan mempertahankan 6 karakter pertama + 4 karakter terakhir (panjang >= 18), jika tidak `***`.
  - Default mencakup penugasan kunci umum, flag CLI, field JSON, header bearer, blok PEM, prefiks token populer, dan nama field kredensial pembayaran seperti nomor kartu, CVC/CVV, token pembayaran bersama, dan kredensial pembayaran.

Beberapa batas keamanan selalu meredaksi terlepas dari `logging.redactSensitive`.
Ini mencakup event tool-call Control UI, output tool `sessions_history`,
ekspor dukungan diagnostik, observasi error penyedia, tampilan perintah persetujuan exec,
dan log protokol WebSocket Gateway. Permukaan ini masih dapat menggunakan
`logging.redactPatterns` sebagai pola tambahan, tetapi `redactSensitive: "off"`
tidak membuatnya memancarkan rahasia mentah.

## Log WebSocket Gateway

Gateway mencetak log protokol WebSocket dalam dua mode:

- **Mode normal (tanpa `--verbose`)**: hanya hasil RPC yang “menarik” yang dicetak:
  - error (`ok=false`)
  - panggilan lambat (ambang default: `>= 50ms`)
  - error penguraian
- **Mode verbose (`--verbose`)**: mencetak semua traffic permintaan/respons WS.

### Gaya log WS

`openclaw gateway` mendukung sakelar gaya per-gateway:

- `--ws-log auto` (default): mode normal dioptimalkan; mode verbose menggunakan output ringkas
- `--ws-log compact`: output ringkas (pasangan permintaan/respons) saat verbose
- `--ws-log full`: output penuh per-frame saat verbose
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

## Pemformatan konsol (pencatatan log subsistem)

Pemformat konsol **TTY-aware** dan mencetak baris yang konsisten dengan prefiks.
Logger subsistem menjaga output tetap terkelompok dan mudah dipindai.

Perilaku:

- **Prefiks subsistem** pada setiap baris (mis. `[gateway]`, `[canvas]`, `[tailscale]`)
- **Warna subsistem** (stabil per subsistem) plus pewarnaan level
- **Warna ketika output adalah TTY atau lingkungan tampak seperti terminal kaya** (`TERM`/`COLORTERM`/`TERM_PROGRAM`), menghormati `NO_COLOR`
- **Prefiks subsistem yang dipersingkat**: menghapus `gateway/` + `channels/` di depan, mempertahankan 2 segmen terakhir (mis. `whatsapp/outbound`)
- **Sub-logger berdasarkan subsistem** (prefiks otomatis + field terstruktur `{ subsystem }`)
- **`logRaw()`** untuk output QR/UX (tanpa prefiks, tanpa pemformatan)
- **Gaya konsol** (mis. `pretty | compact | json`)
- **Level log konsol** terpisah dari level log file (file mempertahankan detail penuh ketika `logging.level` diatur ke `debug`/`trace`)
- **Isi pesan WhatsApp** dicatat pada `debug` (gunakan `--verbose` untuk melihatnya)

Ini menjaga log file yang ada tetap stabil sekaligus membuat output interaktif mudah dipindai.

## Terkait

- [Pencatatan Log](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry)
- [Ekspor diagnostik](/id/gateway/diagnostics)
